import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

import cytoscape, { EdgeSingular, ElementDefinition, NodeSingular } from 'cytoscape';
import fcose, { FcoseLayoutOptions } from 'cytoscape-fcose';

import { MenuItem } from 'primeng/api';
import { BreadcrumbItemClickEvent, BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

import { NodeDataDto } from './fcose.types'

import {
  faReply,
  faShare,
} from '@fortawesome/free-solid-svg-icons';
import {
  faEye,
} from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


cytoscape.use(fcose);

@Component({
  selector: 'app-fcose',
  standalone: true,
  imports: [BreadcrumbModule, ButtonModule, InputTextModule, TagModule, CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './fcose.component.html',
  styleUrl: './fcose.component.scss',
})
export class FcoseComponent implements AfterViewInit, OnInit {
  @ViewChild('graphContainer', { static: true }) graphContainer!: ElementRef;

  // #region activeNodeId
  activeNodeId: string | undefined = undefined;
  @Output() activeNodeIdChange = new EventEmitter<string>();
  private readonly _defaultRootNodeId: string = '00000000-0000-0000-0000-000000000000';
  private _rootNodeId: string = this._defaultRootNodeId;
  // #endregion
  // #region main nodeDataDtos
  get nodeDataDtos(): NodeDataDto[] {
    return this._nodeDataDtos;
  }
  @Input() set nodeDataDtos(nodeDataDtos: NodeDataDto[]) {
    this._nodeDataDtos = nodeDataDtos;
    if (nodeDataDtos.length == 0) {
      this.activeNodeId = undefined;
      this._rootNodeId = this._defaultRootNodeId;
      this.navHome = undefined;
      this.navItems = [];
      this.deletedNodes = [];
      this.currentDeletedNodesIndex = -1;
      this.cy?.elements()?.remove();
    }
    else {
      if (!this.activeNodeId) {
        this._rootNodeId = nodeDataDtos.find(x => x.isMain)?.id ?? this._defaultRootNodeId;
        this.initNavMenuItems();
      }
      this.activeNodeId = nodeDataDtos.find(x => x.isMain)?.id;
      this.hoveredNode = undefined;
      this.selectedNode = undefined;
      this.deletedNodes = [];
      this.currentDeletedNodesIndex = -1;
      this.redrawGraph();
    }
  }
  private _nodeDataDtos: NodeDataDto[] = [];
  // #endregion
  // #region hoveredNode
  get hoveredNode(): NodeSingular | undefined {
    return this._hoveredNode;
  }
  private set hoveredNode(node: NodeSingular | undefined) {
    this._hoveredNode = node;
    const hoveredNodeDto = this.getDataDetailDtoById(node?.id());
    this.hoveredNodeDtoChange.emit(this.getDataDetailDtoById(node?.id()));
  }
  private _hoveredNode?: NodeSingular;
  @Output() hoveredNodeDtoChange = new EventEmitter<NodeDataDto>();
  // #endregion
  // #region selectedNode
  @Input() set selectedNodeId(nodeId: string | undefined) {
    if (nodeId == this._selectedNode?.id()) {
      return;
    }
    if (nodeId) {
      if (this.selectedNode) {
        this.unselectNode(this.selectedNode);
      }
      const node = this.cy.$(`#${nodeId}`);
      if (node) {
        this.selectNode(node);
      }
    }
    else {
      if (this.selectedNode) {
        this.unselectNode(this.selectedNode);
      }
    }
    
  }
  private _selectedNode?: NodeSingular;
  @Output() selectedNodeIdChange = new EventEmitter<string | undefined>();
  private get selectedNode(): NodeSingular | undefined {
    return this._selectedNode;
  }
  private set selectedNode(node: NodeSingular | undefined) {
    this._selectedNode = node;
  }
  // #endregion
  // #region "Deleted" Nodes
  deletedNodes: { deleteType: "single" | "multiple"; nodeIds: string[] }[] = [];
  currentDeletedNodesIndex: number = -1;

  @Output() deletedNodeIdsChange = new EventEmitter<string[]>();
  @Output() undeletedNodeIdsChange = new EventEmitter<string[]>();
  // #endregion
  navItems: MenuItem[] = [];
  navHome: MenuItem | undefined = undefined;
  private cy!: cytoscape.Core;
  private fcoseLayoutOptions: FcoseLayoutOptions = {
    name: 'fcose',
    nodeRepulsion: (node: NodeSingular) => {
      return 20000;
    },
    numIter: 2500,
    animate: false,
    fit: true,
    padding: 10,
    sampleSize: 50,
    nodeSeparation: 500,
    tilingPaddingHorizontal: 1000,
    tilingPaddingVertical: 1000,
    idealEdgeLength: (edge: EdgeSingular) => {
      return 150;
    },
    edgeElasticity: (edge: EdgeSingular) => {
      return 0.15;
    },
  };
  private isDivedIn: boolean = false;
  inputFilterByNameControl = new FormControl();
  private inputFilterByNameValue: string = "";

  clickTimeout?: ReturnType<typeof setTimeout>;
  private doubleClickDelay = 300;

  
  faEye = faEye;
  faReply = faReply;
  faShare = faShare;

  ngOnInit() {
    this.inputFilterByNameControl.valueChanges.pipe(debounceTime(500)).subscribe((value) => {
      this.onInputChange(value);
    });
  }

  ngAfterViewInit() {
    this.setupCyLayout();
    this.setupCyEvents();
  }

  // #region Cy Setup
  private setupCyLayout() {
    this.cy = cytoscape({
      container: this.graphContainer.nativeElement,
      elements: [],
      layout: this.fcoseLayoutOptions as FcoseLayoutOptions,
      style: [
        {
          selector: '$node > .nodeCommon',
          style: {
            'background-color': 'gray',
            'background-opacity': 0.2,
            //'label': 'data(label)',
            'text-valign': 'top',
            'text-halign': 'center',
            'text-background-color': 'aqua',
            'font-size': '14px',
            'font-weight': 'bold',
          },
        },
        {
          selector: '.nodeCommon',
          style: {
            opacity: 1,
            'transition-property': 'opacity',
            'transition-duration': 300,
            'border-width': 1,
          },
        },
        {
          selector: '.nodePackage',
          style: {
            label: 'data(label)',
            width: 'mapData(label.length, 1, 30, 20, 200)',
            height: '20px',
            'background-color': 'Aqua',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'ellipsis',
            'text-max-width': '200px',
            'font-size': '10px',
            'border-color': '#000',
            'transition-property': 'width height background-color font-size border-color opacity',
            'transition-duration': 300,
          },
        },
        {
          selector: '.nodeBranch',
          style: {
            shape: 'roundrectangle',
          },
        },
        {
          selector: '.nodeLeaf',
          style: {
            shape: 'cut-rectangle',
          },
        },
        {
          selector: '.edgeCommon',
          style: {
            width: 1,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'transition-property': 'width line-color opacity',
            'transition-duration': 300,
            opacity: 1,
          },
        },
        {
          selector: '.hoveredCommon, .selectedCommon',
          style: {
            width: 'mapData(label.length, 1, 30, 20, 240)',
            height: '24px',
            'font-size': '12px',
            'transition-property': 'width height background-color font-size border-color opacity',
            'transition-duration': 300,
          },
        },
        {
          selector: '.hovered, .selected',
          style: {
            'background-color': 'Silver',
          },
        },
        {
          selector: '.hoveredOutgoers',
          style: {
            'background-color': 'DeepSkyBlue',
          },
        },
        {
          selector: '.selectedOutgoers',
          style: {
            'background-color': 'Salmon',
          },
        },
        {
          selector: '.hoveredIncomers',
          style: {
            'background-color': 'RoyalBlue',
          },
        },
        {
          selector: '.selectedIncomers',
          style: {
            'background-color': 'Red',
          },
        },
        {
          selector: '.hoveredHighlight',
          style: {
            'overlay-opacity': 0.5,
            'overlay-color': 'RoyalBlue',
            'font-style': 'italic',
          },
        },
        {
          selector: '.selectedHighlight',
          style: {
            'overlay-opacity': 0.5,
            'overlay-color': 'Salmon',
            'font-style': 'italic',
          },
        },
        {
          selector: '.hoveredEdge',
          style: {
            width: 3,
            'line-color': 'Violet',
            'transition-property': 'line-color opacity',
            'transition-duration': 300,
          },
        },
        {
          selector: '.selectedEdge',
          style: {
            width: 3,
            'line-color': 'LightCoral',
            'transition-property': 'line-color opacity',
            'transition-duration': 300,
          },
        },
        {
          selector: '.hidden',
          style: {
            opacity: 0,
          },
        },
        {
          selector: '.deleted',
          style: {
            'visibility': 'hidden',
          },
        },
        {
          selector: '.filtered-highlighted',
          style: {
            width: 'mapData(label.length, 1, 30, 20, 240)',
            height: '24px',
          },
        },
        {
          selector: '.filtered-unhighlighted',
          style: {
            opacity: 0.4,
          },
        },
        {
          selector: '.filtered-semihighlighted',
          style: {
            opacity: 0.8,
          },
        },
      ],
    });
  }

  private setupCyEvents() {
    this.cy.on('mouseover', 'node', (event) => {
      this.hoverHighlightNode(event.target as NodeSingular);
    });

    this.cy.on('mouseout', 'node', (event) => {
      this.hoverUnhighlightNode(event.target as NodeSingular);
    });

    this.cy.on('tap', 'node', (event: cytoscape.EventObject) => {
      if (event.originalEvent.detail === 1) {
        this.clickTimeout = setTimeout(() => {
          this.onSelectNode(event.target as NodeSingular)
        }, this.doubleClickDelay);
      }
    });

    this.cy.on('dbltap', 'node', (event) => {
      clearTimeout(this.clickTimeout);
      this.diveInNode(event.target as NodeSingular);
    });

    if (this.graphContainer) {
      this.graphContainer.nativeElement.setAttribute('tabindex', '0');
      this.graphContainer.nativeElement.addEventListener('keydown', (event: KeyboardEvent) => {
        if ((event.key === 'Delete' || event.key === 'Del') && event.shiftKey) {
          this.deleteNodeChildrenAndOrphans(this.selectedNode);
          return;
        }
        if (event.key === 'Delete' || event.key === 'Del') {
          this.deleteNodeAndOrphans(this.selectedNode);
          return;
        }
      },
      { capture: true });
    }

  }
  // #endregion

  // #region Node Highlightning
  private hoverHighlightNode(node: NodeSingular) {
    if (this.hoveredNode == node || node.isParent()) {
    //if (this.selectedNode || this.hoveredNode == node || node.isParent()) {
      return;
    }
    if (this.hoveredNode) {
      this.hoverUnhighlightNode(this.hoveredNode);
    }
    this.hoveredNode = node;
    this.highlightNode(node, "hovered");
  }

  private hoverUnhighlightNode(node: NodeSingular) {
    if (node.isParent() || this.isDivedIn) {
    //if (this.selectedNode || node.isParent() || this.isDivedIn) {
      return;
    }
    this.unhighlightNode(node, "hovered");
    this.hoveredNode = undefined;
  }
  // #endregion

  private highlightNode(node: NodeSingular, stylePrefix: "hovered" | "selected") {
    node.addClass(`${stylePrefix}Common ${stylePrefix}`);
    this.swapClassNodesHighlightedByName(node, "highlight");
    node.incomers('node').forEach((depNode: NodeSingular) => {
      if (!depNode.hasClass('selectedIncomers') && !depNode.hasClass('selectedCommon')) {
        depNode.addClass(`${stylePrefix}Common`);
        if (node.outgoers('node').has(depNode)) {
          depNode.addClass(`${stylePrefix}Highlight`);
        } else {
          depNode.addClass(`${stylePrefix}Incomers`);
        }
      }
      this.swapClassNodesHighlightedByName(depNode, "highlight");
    });
    node.outgoers('node').forEach((depNode: NodeSingular) => {
      if (!depNode.hasClass('selectedOutgoers') && !depNode.hasClass('selectedCommon')) {
        depNode.addClass(`${stylePrefix}Common ${stylePrefix}Outgoers`);
      }
      this.swapClassNodesHighlightedByName(depNode, "highlight");
    });

    node.connectedEdges().forEach((edge: EdgeSingular) => {
      edge.addClass(`${stylePrefix}Edge`);
    });
  }

  private unhighlightNode(node: NodeSingular, stylePrefix: "hovered" | "selected") {
    node.removeClass(`${stylePrefix}Common ${stylePrefix}`);
    this.swapClassNodesHighlightedByName(node, "unhighlight");

    node.outgoers('node').forEach((depNode: NodeSingular) => {
      depNode.removeClass(`${stylePrefix}Common ${stylePrefix}Outgoers ${stylePrefix}Highlight`);
      this.swapClassNodesHighlightedByName(depNode, "unhighlight");
    });
    node.incomers('node').forEach((depNode: NodeSingular) => {
      depNode.removeClass(`${stylePrefix}Common ${stylePrefix}Incomers`);
      this.swapClassNodesHighlightedByName(depNode, "unhighlight");
    });

    node.connectedEdges().forEach((edge: EdgeSingular) => {
      edge.removeClass(`${stylePrefix}Edge`);
    });
  }

  // #region Node Select
  private onSelectNode(node: NodeSingular) {
    if (this.hoveredNode) {
      this.hoverUnhighlightNode(this.hoveredNode);
    }
    if (this.selectedNode == node) {
      this.unselectNode(node);
      this.hoverHighlightNode(node);
      this.selectedNodeIdChange.emit(undefined);
      return;
    }
    if (this.selectedNode) {
      this.unselectNode(this.selectedNode);
    }
    this.selectNode(node);
    this.selectedNodeIdChange.emit(node.id());
    this.graphContainer.nativeElement.focus();
  }

  private selectNode(node: NodeSingular) {
    this.highlightNode(node, 'selected');
    this.selectedNode = node;
  }
  private unselectNode(node: NodeSingular) {
    this.unhighlightNode(node, "selected");
    this.selectedNode = undefined;
  }
  // #endregion

  private diveInNode(node: NodeSingular) {
    if (node.isParent() || node.hasClass('nodeLeaf')) {
      return;
    }
    if (this.activeNodeId !== node.id()) {
      this.activeNodeIdChange.emit(node.id());
    }
  }

  // #region Menu Bar Events
  onZoomIn() {
    this.cy.animate({
      zoom: this.cy.zoom() + 0.1,
      duration: 300,
    });
  }

  onZoomOut() {
    this.cy.animate({
      zoom: this.cy.zoom() - 0.1,
      duration: 300,
    });
  }

  onZoomFit() {
    const visibleElements = this.cy.elements().filter(ele => !ele.hasClass('deleted'));
    this.cy.animate({
      fit: {
        eles: visibleElements,
        padding: 10,
      },
      duration: 300,
    });
  }

  onUndo() {
    if (this.currentDeletedNodesIndex == -1 || this.deletedNodes.length == 0) {
      return;
    }
    this.undeletedNodeIdsChange.emit(this.deletedNodes[this.currentDeletedNodesIndex].nodeIds);
    this.recreateNodes(this.deletedNodes[this.currentDeletedNodesIndex].nodeIds);
    const node = this.cy.getElementById(this.deletedNodes[this.currentDeletedNodesIndex].nodeIds[0]);
    if (node) {
      if (this.selectedNode) {
        this.unselectNode(this.selectedNode);
      }
      this.selectNode(node);
    }
    this.currentDeletedNodesIndex--;
  }

  onRedo() {
    if (this.currentDeletedNodesIndex >= this.deletedNodes.length - 1) {
      return;
    }
    const node = this.cy.getElementById(this.deletedNodes[this.currentDeletedNodesIndex + 1].nodeIds[0]);
    if (node) {
      switch (this.deletedNodes[this.currentDeletedNodesIndex + 1].deleteType) {
        case "single":
          this.deleteNodeAndOrphans(node, [], true, true);
          break;
        case "multiple":
          this.deleteNodeChildrenAndOrphans(node, true);
          break;
      }
    }
  }

  onShowAll() {
    if (this.deletedNodes.length == 0 || this.currentDeletedNodesIndex == -1) {
      return;
    }
    for (let i = this.currentDeletedNodesIndex; i >= 0; i--) {
      this.undeletedNodeIdsChange.emit(this.deletedNodes[i].nodeIds);
      this.recreateNodes(this.deletedNodes[i].nodeIds);
    }
    this.deletedNodes = [];
    this.currentDeletedNodesIndex = -1;
  }

  
  // #endregion

  private redrawGraph() {
    this.cy.elements().addClass('hidden');

    setTimeout(() => {
      this.cy.elements().remove();

      this.cy.add(this.getElements());

      this.cy.elements().addClass('hidden');

      this.cy.layout(this.fcoseLayoutOptions as FcoseLayoutOptions).run();
      this.onZoomFit();

      this.updateNavMenuItems(this.activeNodeId ?? "");
      setTimeout(() => {
        this.cy.elements().removeClass('hidden');
        if (this.inputFilterByNameValue) {
          this.onNodesHighlightByName(this.inputFilterByNameValue);
        }
        this.isDivedIn = false;
      }, 500);
    }, 350);
    this.isDivedIn = true;
    
  }

  private onNodesHighlightByName(value: string) {
    value = value.toLowerCase();
    this.cy.batch(() => {
      if (value) {
        this.cy.nodes().forEach((node: NodeSingular) => {
          if (!node.isParent()) {
            const label = node.data('label').toLowerCase();
            if (label.includes(value)) {
              node.removeClass('filtered-unhighlighted');
              node.addClass('filtered-highlighted');
            } else {
              node.removeClass('filtered-highlighted');
              node.addClass('filtered-unhighlighted');
            }
          }
        });
      }
      else {
        this.cy.nodes().forEach((node: NodeSingular) => {
          node.removeClass('filtered-highlighted');
          node.removeClass('filtered-unhighlighted');
        })
      }
    });
  }

  private swapClassNodesHighlightedByName(node: NodeSingular, action: "highlight" | "unhighlight") {
    if (node.hasClass('filtered-unhighlighted') && action == "highlight") {
      node.removeClass('filtered-unhighlighted');
      node.addClass('filtered-semihighlighted');
      return;
    }
    if (node.hasClass('filtered-semihighlighted') && action == "unhighlight") {
      node.removeClass('filtered-semihighlighted');
      node.addClass('filtered-unhighlighted');
    }
  }

  private getElements(): ElementDefinition[] {
    const elements: ElementDefinition[] = [];
    const groupMap = new Map<string, number>();
    this.nodeDataDtos
      .filter(x => x.groupName)
      .forEach((x) => {
        const currentCount = (groupMap.get(x.groupName ?? "") || 0) + 1;
        groupMap.set(x.groupName ?? "", currentCount);
      }
    );
    groupMap.forEach((value, key) => {
      if (value > 1) {
        elements.push({ data: { id: key, label: key }, classes: 'nodeCommon' });
      }
    });

    this.nodeDataDtos.forEach(nodeData => {
      const parentId = (groupMap.get(nodeData.groupName ?? "") || 0) > 1 ? nodeData.groupName : undefined;
      elements.push({
        data: {
          id: nodeData.id,
          label: nodeData.name ?? '',
          parent: parentId,
        },
        classes: `nodeCommon nodePackage ${nodeData.dependsOn?.length ? 'nodeBranch' : 'nodeLeaf'}`,
      });
      nodeData.dependsOn?.forEach((depends) => {
        elements.push({
          data: {
            source: nodeData.id,
            target: depends,
          },
          classes: 'edgeCommon',
        });
      });
    });

    return elements;
  }

  // #region navItems
  /**
   * This method initialize the NavMenu.
   */
  private initNavMenuItems() {
    this.navItems = [];
    this.navHome = { id: this._rootNodeId, icon: 'pi pi-sitemap' };
  }

  /**
   * This method initialize the NavMenu.
   * @param {BreadcrumbItemClickEvent} event - the event holding item info
   */
  onNavItemClick(event: BreadcrumbItemClickEvent) {
    if (event.item?.id === this._rootNodeId && this.navItems.length == 0) {
      return;
    }
    if (event.item?.id && this.navItems[this.navItems.length - 1]?.id !== event.item.id) {
      this.activeNodeIdChange.emit(event.item.id);
    }
  }
  /**
   * This method updates the menu with the selected item from the graph
   * @param {string} nodeId - the node id of the selected item
   */
  private updateNavMenuItems(nodeId: string) {
    if (this._rootNodeId === nodeId) {
      this.activeNodeId = nodeId;
      this.navItems = [];
      return;
    }

    const potentialIndex = this.navItems.map((x) => x.id).indexOf(nodeId);
    if (potentialIndex !== -1) {
      this.navItems = this.navItems.slice(0, potentialIndex + 1);
      this.navItems[potentialIndex].styleClass = 'breadcrumb-size';
      this.activeNodeId = nodeId;
      return;
    }

    if (this.navItems.length > 0) {
      this.navItems[this.navItems.length - 1].styleClass = 'breadcrumb-pointer';
    }
    const newDataDetailDto = this.getDataDetailDtoById(nodeId);
    this.navItems = [
      ...this.navItems,
      {
        id: nodeId,
        label: newDataDetailDto?.name ?? 'no-name',
        styleClass: 'breadcrumb-size',
      },
    ];
    this.activeNodeId = nodeId;
  }
  // #endregion

  getDataDetailDtoById(id: string | undefined | null): NodeDataDto | undefined {
    return this.nodeDataDtos.find((x) => x.id == id);
  }

  onInputChange(value: string) {
    this.inputFilterByNameValue = value;
    this.onNodesHighlightByName(value);
  }

  // #region delete nodes
  private deleteNodeAndOrphans(node: NodeSingular | undefined, deletedNodes: string[] = [], isMaster: boolean = true, isRedo: boolean = false) {
    if (node) {
      deletedNodes.push(node.id());
      node.addClass("deleted");
      node.connectedEdges().addClass("deleted");
      node.outgoers('node')
        .filter((x: NodeSingular) => !x.hasClass("deleted"))
        .filter((x: NodeSingular) => x.connectedEdges().filter(x => !x.hasClass("deleted")).length === 0)
        .forEach((x: NodeSingular) => { deletedNodes.push(x.id()); x.addClass("deleted"); });
      if (node == this.selectedNode) {
        this.unhighlightNode(node, "selected");
        this.selectedNode = undefined;
      }
      if (isMaster) {
        this.cleanupParentsAndOrphans(deletedNodes);
        this.processDeletedNodeIds(deletedNodes, "single", isRedo);
      }
    }
  }

  private deleteNodeChildrenAndOrphans(node: NodeSingular | undefined, isRedo: boolean = false) {
    if (node) {
      const deletedNodes: string[] = [];
      this.deleteNodeAndOrphans(node, deletedNodes, false);
      node.outgoers('node').forEach((x: NodeSingular) => this.deleteNodeAndOrphans(x, deletedNodes, false));

      this.cleanupParentsAndOrphans(deletedNodes);
      this.processDeletedNodeIds(deletedNodes, "multiple", isRedo);
    }
  }

  private cleanupParentsAndOrphans(deletedNodeIds: string[]) {
    this.cy.nodes().filter(node => node.isParent())
      .filter((parentNode: NodeSingular) => parentNode.children().filter(x => !x.hasClass("deleted")).length < 2)
      .forEach(parent =>
      {
        parent.children().forEach((node: NodeSingular) => { node.move({ parent: null }); });
      });
    this.cy.nodes().filter(node => node.isParent())
      .filter((parentNode: NodeSingular) => parentNode.children().length == 0)
      .forEach(parent => {
        parent.remove();
      });
    this.cy.nodes()
      .filter(x => !x.isParent() && x.connectedEdges().filter(y => !y.hasClass("deleted")).length === 0 && !x.hasClass("deleted"))
      .forEach(x => { deletedNodeIds.push(x.id()); x.addClass("deleted") });
  }

  recreateNodes(deletedNodes: string[]) {
    deletedNodes.forEach(nodeId => {
      const node = this.cy.getElementById(nodeId);
      if (node) {
        node.removeClass("deleted");
        node.connectedEdges()
          .filter(edge => !edge.source().hasClass("deleted") && !edge.target().hasClass("deleted"))
          .forEach(edge => { edge.removeClass("deleted") });
      }
    });
  }

  private processDeletedNodeIds(deletedNodes: string[], deleteType: "single" | "multiple", isRedo: boolean) {
    if (deletedNodes.length > 0) {
      this.deletedNodeIdsChange.emit(deletedNodes);
      if (!isRedo) {
        this.deletedNodes = this.deletedNodes.slice(0, this.currentDeletedNodesIndex + 1);
        this.deletedNodes.push({ deleteType: deleteType, nodeIds: deletedNodes, });
      }
      this.currentDeletedNodesIndex++;
    }
  }
  // #endregion
}
