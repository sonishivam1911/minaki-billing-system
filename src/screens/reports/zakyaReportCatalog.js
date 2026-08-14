import { InvoiceMonthlyRevenueScreen } from './InvoiceMonthlyRevenueScreen';
import { InvoiceProductSalesScreen } from './InvoiceProductSalesScreen';
import { InvoiceRegisterScreen } from './InvoiceRegisterScreen';
import { SalesOrderProductSalesScreen } from './SalesOrderProductSalesScreen';
import { SalesOrderRegisterScreen } from './SalesOrderRegisterScreen';
import {
  REPORT_ID_INVOICE_MONTHLY,
  REPORT_ID_INVOICE_PRODUCT_SALES,
  REPORT_ID_INVOICE_REGISTER,
  REPORT_ID_SALES_ORDER_PRODUCT_SALES,
  REPORT_ID_SALES_ORDER_REGISTER,
} from './zakyaReportOptions';

const SCREEN_FACTORIES = {
  [REPORT_ID_INVOICE_REGISTER]: () => new InvoiceRegisterScreen(),
  [REPORT_ID_INVOICE_MONTHLY]: () => new InvoiceMonthlyRevenueScreen(),
  [REPORT_ID_INVOICE_PRODUCT_SALES]: () => new InvoiceProductSalesScreen(),
  [REPORT_ID_SALES_ORDER_REGISTER]: () => new SalesOrderRegisterScreen(),
  [REPORT_ID_SALES_ORDER_PRODUCT_SALES]: () => new SalesOrderProductSalesScreen(),
};

export const ZAKYA_REPORT_PATHS = {
  [REPORT_ID_INVOICE_REGISTER]: '/reports/zakya/zakya-invoice-register',
  [REPORT_ID_INVOICE_MONTHLY]: '/reports/zakya/zakya-invoice-monthly',
  [REPORT_ID_INVOICE_PRODUCT_SALES]: '/reports/zakya/zakya-invoice-product-sales',
  [REPORT_ID_SALES_ORDER_REGISTER]: '/reports/zakya/zakya-sales-order-register',
  [REPORT_ID_SALES_ORDER_PRODUCT_SALES]: '/reports/zakya/zakya-sales-order-product-sales',
};

export const createZakyaReportScreen = (reportId) => {
  const factory = SCREEN_FACTORIES[reportId];
  return factory ? factory() : null;
};
