import { definePreset } from "@primeng/themes";
import Aura from '@primeng/themes/aura';
import Nora from '@primeng/themes/nora';
import Lara from '@primeng/themes/lara';

export const trivyOperatorDashboardPreset = definePreset(Nora, {
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
      light: {
        surface: {
          0:   '#F8F8FD',
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
        text: { color: '#000000' },
        'tod-togglebutton-background-border-color': '{surface.100}',
        'tod-blockquote-text-color': '{surface.900}',
      },
      dark: {
        surface: {
          0:   '#FDFDFD',
          50:  '#EAEDEF',
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
        },
        text: { color: '#ffffff' },
        'tod-togglebutton-background-border-color': '{surface.950}',
        'tod-blockquote-text-color': '{surface.200}',
      },

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
    card: {
      shadow: 'var(--tod-card-shadow)',
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
        background: 'var(--tod-datatable-footer-cell-background)',
        cell: {
          background: 'var(--tod-datatable-footer-cell-background)',
        },
      },
      header: {
        cell: {
          padding: 'var(--tod-datatable-header-cell-padding)',
          selected: {
            background: 'var(--p-datatable-header-cell-background)',
            color:'var(--p-button-text-primary-color)',
          },
          sm: {
            padding: 'var(--tod-datatable-header-cell-padding)',
          }
        },
      },
    },
    drawer: {
      header: {
        padding: '0.5rem 0',
      },
      content: {
        padding: '0 0.5rem',
      },
    },
    selectbutton: {
      border: {
        radius: 'var(--tod-selectbutton-border-radius)',
      },
    },
    splitter: {
      border: {
        radius: 'var(--tod-selectbutton-border-radius)',
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
