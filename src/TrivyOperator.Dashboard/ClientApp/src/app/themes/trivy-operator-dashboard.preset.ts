import { definePreset } from "@primeng/themes";
import Aura from '@primeng/themes/aura';
import Nora from '@primeng/themes/nora';
import Lara from '@primeng/themes/lara';

export const trivyOperatorDashboardPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{sky.50}',
      100: '{sky.100}',
      200: '{sky.200}',
      300: '{sky.300}',
      400: '{sky.400}',
      500: '{sky.500}',
      600: '{sky.600}',
      700: '{sky.700}',
      800: '{sky.800}',
      900: '{sky.900}',
      950: '{sky.950}'
    },
    colorScheme: {
      dark: {
        surface: {
          50: '#EAEDEF',
          100: '#D4DAE0',
          200: '#B8C2CD',
          300: '#9DAAB9',
          400: '#8291A5',
          500: '#677892',
          600: '#4E5F7B',
          700: '#3D4B64',
          800: '#2D374E',
          900: '#2A323D',
          950: '#171E27'
        }
      }
    },
  },
  components: {
    button: {
      label: {
        font: {
          weight: 'var(--tod-button-label-font-weight)',
        },
      },
    },
    datatable: {
      body: {
        cell: {
          padding: 'var(--tod-datatable-body-cell-padding)',
        },
      },
      column: {
        title: {
          font: {
            weight: 'var(--tod-datatable-column-title-font-weight)',
          },
        },
      },
      footer: {
        background: 'var(--p-surface-700)',
        cell: {
          background: 'var(--p-surface-700)',
        },
      },
      header: {
        cell: {
          padding: 'var(--tod-datatable-header-cell-padding)',
          sm: {
            padding: 'var(--tod-datatable-header-cell-padding)',
          }
        },
      },
    },
    tabs: {
      tab: {
        padding: 'var(--tod-tabs-tab-padding)',
      },
    },
    tag: {
      font: {
        size: 'var(--tod-tag-font-size)',
        weight: 'var(--tod-tag-font-weight)',
      },
      primary: {
        color: 'var(--tod-tag-primary-color)',
      },
    },
  },
});
