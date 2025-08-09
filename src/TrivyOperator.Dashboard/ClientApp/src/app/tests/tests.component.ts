import { Component, inject, OnInit } from '@angular/core';
import { SbomReportService } from '../../api/services/sbom-report.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { SbomReportDto } from '../../api/models/sbom-report-dto';
import { SbomReportImageDto } from '../../api/models/sbom-report-image-dto';

import { GenericSbomComponent } from '../ui-elements/generic-sbom/generic-sbom.component';
import { TreeNode } from 'primeng/api';
import { ImageInfo, TrivyDependencyComponent } from '../trivy-dependency/trivy-dependency.component';

import { SeverityCssStyleByIdPipe } from '../pipes/severity-css-style-by-id.pipe';
import { SeverityNameByIdPipe } from '../pipes/severity-name-by-id.pipe';
import { TableModule } from 'primeng/table';

import { VulnerabilityCountPipe } from '../pipes/vulnerability-count.pipe';

import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TreeTableModule } from 'primeng/treetable';

@Component({
  selector: 'app-tests',
  imports: [
    GenericSbomComponent,TrivyDependencyComponent,
    SeverityCssStyleByIdPipe, SeverityNameByIdPipe, VulnerabilityCountPipe,
    CardModule, DialogModule, TableModule, TagModule, TreeTableModule, ],
  templateUrl: './tests.component.html',
  styleUrl: './tests.component.scss'
})
export class TestsComponent implements OnInit {
  dataDtos: SbomReportImageDto[] = [];
  fullSbomDataDto?: SbomReportDto;
  selectedImageId?: string;
  selectedSbomReportImageDto?: SbomReportImageDto;

  queryNamespaceName?: string;
  queryDigest?: string;
  isStatic: boolean = false;

  // region dialog related vars
  isSbomReportOverviewDialogVisible: boolean = false;
  sbomReportDetailStatistics: Array<number | undefined> = [];
  sbomReportDetailPropertiesTreeNodes: TreeNode[] = [];
  sbomReportDetailLicensesTreeNodes: TreeNode[] = [];

  isDependencyTreeViewVisible: boolean = false;
  trivyImage?: ImageInfo;
  trivyDependencyDialogTitle: string = "";
  // endregion

  private readonly service = inject(SbomReportService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    this.activatedRoute.queryParamMap.subscribe(params => {
      this.queryNamespaceName = params.get('namespaceName') ?? undefined;
      this.queryDigest = params.get('digest') ?? undefined;
    });

    this.isStatic = !!(this.queryNamespaceName && this.queryDigest);

    this.getTableDataDtos();
  }

  getTableDataDtos() {
    this.service.getSbomReportImageDtos().subscribe({
      next: (res) => this.onGetDataDtos(res),
      error: (err) => console.error(err),
    });
  }

  onGetDataDtos(dtos: SbomReportImageDto[]) {
    this.dataDtos = dtos;
    if (this.isStatic) {
      const queryDto = dtos
        .find(x => x.imageDigest == this.queryDigest && x.resourceNamespace == this.queryNamespaceName);
      if (queryDto) {
        this.selectedImageId = queryDto.uid;
      }
    }
  }

  onSelectedImageIdChange(imageId: string | undefined) {
    this.selectedSbomReportImageDto = this.dataDtos?.find(x => x.uid === imageId);
    if (this.selectedSbomReportImageDto) {
      this.service
        .getSbomReportDtoByDigestNamespace({
          digest: this.selectedSbomReportImageDto.imageDigest,
          namespaceName: this.selectedSbomReportImageDto.resourceNamespace })
        .subscribe({
          next: (res) => this.onGetSbomReportDtoByDigestNamespace(res),
          error: (err) => console.error(err),
      });
    }
  }

  onGetSbomReportDtoByDigestNamespace(fullSbomDataDto: SbomReportDto) {
    this.fullSbomDataDto = fullSbomDataDto;
  }

  onRefreshRequestedChange() {
    this.getTableDataDtos();
  }

  onMultiActionEventChange(value: string) {
    switch (value) {
      case "goToDetailedPage":
        this.goToDetailedPage();
        break;
      case "Info":
        this.onSbomReportOverviewDialogOpen();
        break;
      case "Export CycloneDX JSON":
        this.exportSbom('cyclonedx','json');
        break;
      case "Export CycloneDX XML":
        this.exportSbom('cyclonedx','xml');
        break;
      case "Export SPDX":
        this.exportSbom('spdx','json');
        break;
      case "Dependency tree":
        this.goToDependencyTree();
        break;
      default:
        console.error("sbom - multi action call back - unknown: " + event);
    }
  }

  onSbomReportOverviewDialogOpen() {
    if (this.sbomReportDetailPropertiesTreeNodes.length == 0) {
      this.sbomReportDetailPropertiesTreeNodes = this.getSbomReportPropertyTreeNodes();
    }
    if (this.sbomReportDetailLicensesTreeNodes.length == 0) {
      this.sbomReportDetailLicensesTreeNodes = this.getSbomReportLicenseTreeNodes();
    }
    if (this.sbomReportDetailStatistics.length == 0) {
      this.sbomReportDetailStatistics.push(this.selectedSbomReportImageDto?.criticalCount ?? -1);
      this.sbomReportDetailStatistics.push(this.selectedSbomReportImageDto?.highCount ?? -1);
      this.sbomReportDetailStatistics.push(this.selectedSbomReportImageDto?.mediumCount ?? -1);
      this.sbomReportDetailStatistics.push(this.selectedSbomReportImageDto?.lowCount ?? -1);
      this.sbomReportDetailStatistics.push(this.selectedSbomReportImageDto?.unknownCount ?? -1);

      this.sbomReportDetailStatistics.push(this.fullSbomDataDto?.details?.length ?? 0);
      this.sbomReportDetailStatistics.push(this.fullSbomDataDto?.details?.map(item => item.dependsOn)
        .filter((deps): deps is Array<string> => Array.isArray(deps))
        .reduce((sum, deps) => sum + deps.length, 0) ?? 0);
    }

    this.isSbomReportOverviewDialogVisible = true;
  }

  exportSbom(fileFormat: 'cyclonedx' | 'spdx', contentType: 'json' | 'xml') {
    const apiRoot = this.service.rootUrl;
    const namespaceName = encodeURIComponent(this.selectedSbomReportImageDto?.resourceNamespace ?? "");
    const digest = encodeURIComponent(this.selectedSbomReportImageDto?.imageDigest ?? "");
    const fileUrl = `${apiRoot}/api/sbom-reports/${fileFormat}?digest=${digest}&namespaceName=${namespaceName}`;

    const headers = new HttpHeaders({
      'Accept': contentType === 'json' || fileFormat === 'spdx' ? 'application/json' : 'application/xml'
    });

    this.http.get(fileUrl, { headers, responseType: 'text' }).subscribe({
      next: (response: string) => {
        const imageNameTag = `${this.selectedSbomReportImageDto?.imageName}:${this.selectedSbomReportImageDto?.imageTag}`
        const blob = new Blob([response], { type: contentType === 'json' || fileFormat === 'spdx' ? 'application/json' : 'application/xml' });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        link.download = `sbom_${fileFormat}_${imageNameTag}.${contentType}`;
        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(`Error fetching the file as ${contentType}:`, err);
      }
    });
  }

  private goToDependencyTree() {
    if (!this.selectedSbomReportImageDto) return;

    const digest = this.selectedSbomReportImageDto.imageDigest;
    const namespace = this.selectedSbomReportImageDto.resourceNamespace;
    if (digest && namespace) {
      const imageRepository = this.selectedSbomReportImageDto.imageRepository ?? 'n/a';
      const imageName = this.selectedSbomReportImageDto.imageName ?? 'n/a';
      const imageTag = this.selectedSbomReportImageDto.imageTag ?? 'n/a';
      const imageNamespace = this.selectedSbomReportImageDto.resourceNamespace ?? 'n/a';
      this.trivyDependencyDialogTitle = `Dependency Tree for Image ${imageRepository}/${imageName}:${imageTag} in ${imageNamespace}`;
      this.trivyImage = { digest: digest, namespaceName: namespace };
      this.isDependencyTreeViewVisible = true;
    }
  }

  private goToDetailedPage() {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/sbom-reports-detailed'])
    );
    window.open(url, '_blank');
  }

  /**
   * Get Properties TreeNodes
   * First, it creates a Map<> with all PropertyName and {propertyValue, usedBy} - usedBy is the SbomDetail Name
   * Then, for each one, it creates a Set<> with propertyValue and then counts children
   * the final usedByCount for each propertyName is a unique sum of all usedBy children
   */
  private getSbomReportPropertyTreeNodes(): TreeNode[] {
    const tree: TreeNode[] = [];

    const dataMap = new Map<string, { propValue: string, usedBy: string }[]>();

    this.fullSbomDataDto?.details?.forEach(item => {
      const usedBy = item.name ?? "unknown";

      item.properties?.forEach(property => {
        const propName = property[0] ?? "unknown";
        const propValue = property[1] ?? "unknown";

        if (!dataMap.has(propName)) {
          dataMap.set(propName, []);
        }

        dataMap.get(propName)!.push({ propValue, usedBy });
      });
    });

    dataMap.forEach((entries, propName) => {
      const uniqueUsedBySet = new Set<string>();

      const propNameNode: TreeNode = {
        data: { name: propName, usedByCount: 0 },
        children: []
      };

      const propValueUsedByMap = new Map<string, Set<string>>();
      entries.forEach(entry => {
        uniqueUsedBySet.add(entry.usedBy);

        if (!propValueUsedByMap.has(entry.propValue)) {
          propValueUsedByMap.set(entry.propValue, new Set<string>());
        }
        propValueUsedByMap.get(entry.propValue)!.add(entry.usedBy);
      });

      propValueUsedByMap.forEach((usedBySet, propValue) => {
        const propValueNode: TreeNode = {
          data: { name: propValue, usedByCount: usedBySet.size },
          children: []
        };

        usedBySet.forEach(usedBy => {
          propValueNode.children!.push({
            data: { name: usedBy, usedByCount: undefined },
            children: []
          });
        });

        propNameNode.children!.push(propValueNode);
      });

      propNameNode.data.usedByCount = uniqueUsedBySet.size;

      tree.push(propNameNode);
    });

    return tree;
  }

  private getSbomReportLicenseTreeNodes(): TreeNode[] {
    const licenseMap = new Map<string, Set<string>>();

    this.fullSbomDataDto?.details?.forEach(item => {
      (item.licenses || []).forEach(license => {
        if (!licenseMap.has(license)) {
          licenseMap.set(license, new Set<string>());
        }
        licenseMap.get(license)!.add(item.name ?? "unknown");
      });
    });

    const tree: TreeNode[] = [];
    licenseMap.forEach((names, license) => {
      const licenseNode: TreeNode = {
        data: { name: license, count: names.size },
        children: Array.from(names).map(name => ({
          data: { name: name, count: undefined },
          children: []
        }))
      };
      tree.push(licenseNode);
    });

    return tree;
  }
}
