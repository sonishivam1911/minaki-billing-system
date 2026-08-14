export const AGENT_HOW_TO = {
  writer: {
    title: 'Product Writer',
    what: 'This updates product names and descriptions on the Minaki website. Use it when a list of SKUs needs better copy.',
    steps: [
      'Choose Upload CSV (a column of SKUs) or Pick from Shopify.',
      'Check the preview so you know which products will change.',
      'Leave “dry run” on the first time — that shows the new copy without saving.',
      'Turn dry run off and run again when you are happy, so it writes to Shopify.',
    ],
  },
  reviewer: {
    title: 'Product Reviewer',
    what: 'This writes customer-style reviews for jewellery that is in stock and live on the website (and Facebook, if that filter is on).',
    steps: [
      'Wait for the two lists to load: products with no reviews, and products that already have some.',
      'Click a product. You should see its existing reviews underneath.',
      'Set how many reviews to add, then tap Generate + publish.',
      'Refresh the lists after it finishes. The product should move to “With reviews”.',
    ],
  },
  keywords: {
    title: 'Keywords',
    what: 'This finds search phrases people use for jewellery (for example “kundan necklace set”) and saves them so naming and SEO can use them.',
    steps: [
      'Type a few seed words, one per line — the jewellery type you care about.',
      'Tap Fetch and save. Similar phrases are stored in the warehouse.',
      'Use the view menu to browse DataForSEO results or everything saved.',
      'Filter the table if you are looking for one seed or phrase.',
    ],
  },
  naming: {
    title: 'Naming Teams',
    what: 'This invents jewellery names in a chosen style (for example Mughal, Greek myth). Each “team” is a style recipe.',
    steps: [
      'Pick an existing team, or create one and describe the mood in plain words.',
      'Enter the product type (Crystal Earrings, Kundan Choker Set).',
      'Generate names. They land in the name bank below.',
      'Search the bank later when you are writing a new product.',
    ],
  },
  collections: {
    title: 'Collection Builder',
    what: 'This writes the story and the top banner for a shop collection page — Earrings, Bridal, and so on — then puts them on Shopify.',
    steps: [
      'Type part of the collection name to find it (the list loads a small page first, so it should appear quickly).',
      'Pick a hero product from the photos. Newer pieces show first.',
      'Generate the page copy, then generate a banner.',
      'Apply the banner when you like it. That updates the live collection page.',
    ],
  },
  campaign: {
    title: 'Campaign Creative',
    what: 'This plans a two-week Instagram campaign: themes, then photos you can download as a pack.',
    steps: [
      'Pick the brand look (modern or traditional).',
      'Start a run. Read the theme ideas it suggests.',
      'Approve the themes you want, then produce the assets.',
      'Download the ZIP when production is done.',
    ],
  },
  banners: {
    title: 'Banner Generation',
    what: 'This makes ad or website banners from a product photo. You brief it in normal language, then tweak.',
    steps: [
      'Write a short brief (festival, product, where the ad should send people).',
      'Upload a clear product photo. Lifestyle photos are optional.',
      'Generate. Scroll the variants and pick one.',
      'If it is off, type what to change and regenerate.',
    ],
  },
  marketing: {
    title: 'Meta Marketing',
    what: 'This shows how Facebook and Instagram ads are doing, next to what actually sold in the shop.',
    steps: [
      'Pick a date range and whether you want day, week, or month buckets.',
      'Select the campaigns you care about.',
      'Run the report. It saves to your history so you can open it again.',
      'Scroll to the Shopify section for what sold in store vs what the ads spent.',
    ],
  },
};
