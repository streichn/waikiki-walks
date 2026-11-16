// Credits and copyright notices shown in the app. Keep in sync with legal/CHECKLIST.md.

export const AUTHOR = 'Veneeta Acson, Ph.D.';
export const DEDICATION = 'For Alice and Ezra';
export const APP_COPYRIGHT = `© ${new Date().getFullYear() > 2026 ? `2026–${new Date().getFullYear()}` : '2026'} Veneeta Acson. All rights reserved.`;

export const CREDITS: { title: string; lines: string[] }[] = [
  {
    title: 'Author',
    lines: ['Text by Veneeta Acson, Ph.D.', 'Adapted from her book "Waikīkī: Twelve Walks Through Time" (First Edition, 2023).'],
  },
  {
    title: 'Dedication',
    lines: [
      'To my grandchildren, Alice and Ezra, who have learned to love walking in the ahupuaʻa of Waikīkī.',
      'In memory of my mother, Alice Acson, who loved walking in Waikīkī.',
    ],
  },
  {
    title: 'The book',
    lines: [
      '"Waikīkī: Twelve Walks Through Time" © 2023 Island Heritage. All rights reserved.',
      'Published and distributed by Island Heritage, Mililani, Hawaiʻi. welcometotheislands.com',
      // TODO before launch: keep this line only once Island Heritage's written permission is in hand (legal/CHECKLIST.md).
      'Book text and photographs appear in this app with the permission of the copyright holders.',
    ],
  },
  {
    title: 'Photographs',
    lines: [
      'Contributing photography: Merina Vo and Joel Bradshaw.',
      'Book cover: Cameron Brooks.',
      'Historic photographs are credited in their captions, including the Hawaiʻi State Archives.',
    ],
  },
  {
    title: 'Maps and places',
    lines: [
      'Map data © OpenStreetMap contributors, available under the Open Database License (openstreetmap.org/copyright).',
      'Base maps are provided by Apple Maps on iPhone and Google Maps on Android.',
      'Walking paths between stops were computed with OSRM on the FOSSGIS routing service (routing.openstreetmap.de) from OpenStreetMap data. Spot a missing footpath? Fix it at openstreetmap.org/fixthemap.',
    ],
  },
  {
    title: 'Fonts and software',
    lines: [
      'Libre Caslon Text and Nunito, under the SIL Open Font License.',
      'Built with Expo and React Native (MIT License) and other open-source software.',
    ],
  },
];

export const LINKS = {
  privacy: 'https://example.com/waikiki-walks/privacy', // TODO: publish legal/PRIVACY.md and replace
  terms: 'https://example.com/waikiki-walks/terms', // TODO: publish legal/TERMS.md and replace
  appleEula: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
};
