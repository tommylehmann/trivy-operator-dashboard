import { definePreset } from "@primeng/themes";
import Nora from '@primeng/themes/nora';

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
    }
  }
});
