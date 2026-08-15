export const ZAKYA_BRANCH_OPTIONS = [
  { value: 'MINAKI JewelBox Aerocity', label: 'MINAKI JewelBox Aerocity' },
  { value: 'Head Office', label: 'Head Office' },
];

export const ZAKYA_INVOICE_STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'draft', label: 'Draft' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
];

export const ZAKYA_SALES_ORDER_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'draft', label: 'Draft' },
  { value: 'void', label: 'Void' },
];

export const REPORT_ID_INVOICE_REGISTER = 'zakya-invoice-register';
export const REPORT_ID_INVOICE_MONTHLY = 'zakya-invoice-monthly';
export const REPORT_ID_SALES_ORDER_REGISTER = 'zakya-sales-order-register';
export const REPORT_ID_INVOICE_PRODUCT_SALES = 'zakya-invoice-product-sales';
export const REPORT_ID_SALES_ORDER_PRODUCT_SALES = 'zakya-sales-order-product-sales';

/** Shared product-attribute dropdowns (options loaded from API). */
export const ZAKYA_PRODUCT_ATTRIBUTE_FILTER_FIELDS = [
  {
    key: 'category_name',
    type: 'select',
    label: 'Category',
    optionsSource: 'zakya_product',
    optionsKey: 'category_name',
  },
  {
    key: 'group_name',
    type: 'select',
    label: 'Group',
    optionsSource: 'zakya_product',
    optionsKey: 'group_name',
  },
  {
    key: 'brand',
    type: 'select',
    label: 'Brand',
    optionsSource: 'zakya_product',
    optionsKey: 'brand',
  },
  {
    key: 'collection',
    type: 'select',
    label: 'Collection',
    optionsSource: 'zakya_product',
    optionsKey: 'collection',
  },
  {
    key: 'gender',
    type: 'select',
    label: 'Gender',
    optionsSource: 'zakya_product',
    optionsKey: 'gender',
  },
  {
    key: 'work',
    type: 'select',
    label: 'Work',
    optionsSource: 'zakya_product',
    optionsKey: 'work',
  },
  {
    key: 'finish',
    type: 'select',
    label: 'Finish',
    optionsSource: 'zakya_product',
    optionsKey: 'finish',
  },
  {
    key: 'color',
    type: 'select',
    label: 'Color',
    optionsSource: 'zakya_product',
    optionsKey: 'color',
  },
  {
    key: 'size',
    type: 'select',
    label: 'Size',
    optionsSource: 'zakya_product',
    optionsKey: 'size',
  },
];
