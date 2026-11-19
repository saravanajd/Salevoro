import React from 'react';
import { DCLogic, cssObj } from '../../lib/DCLogic';
import { db } from '../../api/db';
import { A, scGo, scMain, toRoute } from '../../lib/nav';
import styles from './Schema.module.css';

export default class Schema extends DCLogic {
  state: any = { sel: null, q: '' };
  G = [
    ['Organisation & security', 'Store profile, branches, staff and roles', [
      'StoreConfig|StoreId TINYINT PK;StoreName NVARCHAR(100);LegalName NVARCHAR(150);GSTIN VARCHAR(15);Mobile VARCHAR(10);Landline VARCHAR(15);Email NVARCHAR(120);Website NVARCHAR(120);Address NVARCHAR(300);LogoImage VARBINARY(MAX);LogoMimeType VARCHAR(30);InvoiceFooter NVARCHAR(300);UpdatedBy INT FK>AppUser;UpdatedAt DATETIME2',
      'Branch|BranchId INT PK;StoreId TINYINT FK>StoreConfig;BranchCode VARCHAR(10) UQ;Name NVARCHAR(100);Address NVARCHAR(250);StateCode CHAR(2);GSTIN VARCHAR(15);Mobile VARCHAR(10);IsActive BIT',
      'Role|RoleId TINYINT PK;Name NVARCHAR(40) UQ;Permissions NVARCHAR(MAX)',
      'AppUser|UserId INT PK;EmployeeCode VARCHAR(10) UQ;BranchId INT FK>Branch;RoleId TINYINT FK>Role;FullName NVARCHAR(100);Mobile VARCHAR(10) UQ;Email NVARCHAR(120);PhotoImage VARBINARY(MAX);PasswordHash VARBINARY(64);PosPinHash VARBINARY(64);Preferences NVARCHAR(MAX);IsActive BIT;LastLoginAt DATETIME2', 'UserSession|SessionId UNIQUEIDENTIFIER PK;UserId INT FK>AppUser;BranchId INT FK>Branch;Device NVARCHAR(100);SignedInAt DATETIME2;SignedOutAt DATETIME2',
      'DocumentSequence|BranchId INT PK,FK>Branch;DocType VARCHAR(10) PK;FinancialYear CHAR(5) PK;Prefix VARCHAR(10);NextNumber INT']],
    ['Customers', 'Profiles, loyalty and occasions', [
      'Customer|CustomerId INT PK;CustomerCode VARCHAR(12) UQ;FullName NVARCHAR(100);Mobile VARCHAR(10) UQ;Email NVARCHAR(120);DateOfBirth DATE;AnniversaryDate DATE;GSTIN VARCHAR(15);Address NVARCHAR(250);City NVARCHAR(60);StateCode CHAR(2);PreferredSize VARCHAR(6);Tier VARCHAR(10);LoyaltyPoints INT;MarketingOptIn BIT;WhatsAppOptIn BIT;WhatsAppOptInAt DATETIME2;CreatedBy INT FK>AppUser;CreatedAt DATETIME2',
      'LoyaltyLedger|LedgerId BIGINT PK;CustomerId INT FK>Customer;InvoiceId BIGINT FK>Invoice;Points INT;Reason VARCHAR(20);CreatedAt DATETIME2',
      'CustomerOccasion|OccasionId INT PK;CustomerId INT FK>Customer;OccasionType VARCHAR(12);OccasionDate DATE;Notes NVARCHAR(200);LastNotifiedAt DATETIME2']],
    ['Products & items', 'Design (product) → sellable variant (item / SKU)', [
      'Category|CategoryId SMALLINT PK;Name NVARCHAR(60);ParentCategoryId SMALLINT FK>Category',
      'TaxSlab|TaxSlabId SMALLINT PK;SlabCode VARCHAR(6) UQ;Name NVARCHAR(80);RateType VARCHAR(10);FixedRate DECIMAL(5,2);RateLow DECIMAL(5,2);RateHigh DECIMAL(5,2);ThresholdAmount DECIMAL(12,2);CessRate DECIMAL(5,2);EffectiveFrom DATE;EffectiveTo DATE;IsActive BIT', 'TaxSlabHSN|TaxSlabId SMALLINT PK,FK>TaxSlab;HSNCode VARCHAR(8) PK',
      'Product|ProductId INT PK;ProductCode VARCHAR(12) UQ;Name NVARCHAR(120);CategoryId SMALLINT FK>Category;TaxSlabId SMALLINT FK>TaxSlab;SupplierId INT FK>Supplier;Fabric NVARCHAR(60);Brand NVARCHAR(60);Season NVARCHAR(30);DefaultMRP DECIMAL(12,2);IsActive BIT',
      'ProductItem|ItemId INT PK;ProductId INT FK>Product;SKU VARCHAR(24) UQ;Barcode VARCHAR(14) UQ;Size VARCHAR(6);Color NVARCHAR(30);MRP DECIMAL(12,2);CostPrice DECIMAL(12,2);TaxSlabId SMALLINT FK>TaxSlab;IsActive BIT']],
    ['Inventory', 'Stock per branch and every movement', [
      'Inventory|BranchId INT PK,FK>Branch;ItemId INT PK,FK>ProductItem;QtyOnHand INT;ReorderLevel INT;RowVer ROWVERSION',
      'StockMovement|MovementId BIGINT PK;BranchId INT FK>Branch;ItemId INT FK>ProductItem;MovementType VARCHAR(12);Qty INT;RefType VARCHAR(12);RefId BIGINT;CreatedBy INT FK>AppUser;CreatedAt DATETIME2',
      'StockTransfer|TransferId INT PK;TransferNo VARCHAR(16) UQ;FromBranchId INT FK>Branch;ToBranchId INT FK>Branch;Status VARCHAR(10);CreatedBy INT FK>AppUser;CreatedAt DATETIME2',
      'StockTransferLine|TransferLineId INT PK;TransferId INT FK>StockTransfer;ItemId INT FK>ProductItem;Qty INT']],
    ['Sales — invoice, payment, returns', 'GST tax invoice with split payments', [
      'Invoice|InvoiceId BIGINT PK;InvoiceNo VARCHAR(20) UQ;BranchId INT FK>Branch;CustomerId INT FK>Customer;SalespersonId INT FK>AppUser;CashierId INT FK>AppUser;InvoiceDate DATETIME2;PlaceOfSupply CHAR(2);GrossAmount DECIMAL(12,2);DiscountAmount DECIMAL(12,2);LoyaltyRedeemed DECIMAL(12,2);TaxableAmount DECIMAL(12,2);CGST DECIMAL(12,2);SGST DECIMAL(12,2);IGST DECIMAL(12,2);RoundOff DECIMAL(5,2);NetAmount DECIMAL(12,2);Status VARCHAR(12)',
      'InvoiceLine|InvoiceLineId BIGINT PK;InvoiceId BIGINT FK>Invoice;ItemId INT FK>ProductItem;HSNCode VARCHAR(8);Qty INT;MRP DECIMAL(12,2);DiscountPct DECIMAL(5,2);DiscountAmount DECIMAL(12,2);TaxableAmount DECIMAL(12,2);TaxSlabId SMALLINT FK>TaxSlab;GSTRate DECIMAL(5,2);CGST DECIMAL(12,2);SGST DECIMAL(12,2);IGST DECIMAL(12,2);LineTotal DECIMAL(12,2)',
      'PaymentMode|PaymentModeId TINYINT PK;Name VARCHAR(20) UQ;NeedsReference BIT',
      'InvoicePayment|PaymentId BIGINT PK;InvoiceId BIGINT FK>Invoice;PaymentModeId TINYINT FK>PaymentMode;Amount DECIMAL(12,2);ReferenceNo VARCHAR(40);PaidAt DATETIME2',
      'SalesReturn|ReturnId INT PK;CreditNoteNo VARCHAR(16) UQ;InvoiceId BIGINT FK>Invoice;BranchId INT FK>Branch;Reason NVARCHAR(60);Settlement VARCHAR(20);Amount DECIMAL(12,2);CreatedBy INT FK>AppUser;CreatedAt DATETIME2',
      'SalesReturnLine|ReturnLineId INT PK;ReturnId INT FK>SalesReturn;InvoiceLineId BIGINT FK>InvoiceLine;Qty INT;Amount DECIMAL(12,2)']],
    ['Purchases & suppliers', 'Goods receipt, input GST and payables', [
      'Supplier|SupplierId INT PK;SupplierCode VARCHAR(10) UQ;Name NVARCHAR(120);GSTIN VARCHAR(15);StateCode CHAR(2);City NVARCHAR(60);ContactName NVARCHAR(80);Mobile VARCHAR(10);CreditDays SMALLINT;OpeningBalance DECIMAL(12,2)',
      'Purchase|PurchaseId INT PK;GRNNo VARCHAR(16) UQ;SupplierId INT FK>Supplier;BranchId INT FK>Branch;SupplierInvoiceNo VARCHAR(30);SupplierInvoiceDate DATE;TaxableAmount DECIMAL(12,2);CGST DECIMAL(12,2);SGST DECIMAL(12,2);IGST DECIMAL(12,2);TotalAmount DECIMAL(12,2);PaymentStatus VARCHAR(10);CreatedBy INT FK>AppUser',
      'PurchaseLine|PurchaseLineId INT PK;PurchaseId INT FK>Purchase;ItemId INT FK>ProductItem;Qty INT;UnitCost DECIMAL(12,2);GSTRate DECIMAL(5,2);TaxAmount DECIMAL(12,2);LineTotal DECIMAL(12,2)',
      'SupplierPayment|SupplierPaymentId INT PK;SupplierId INT FK>Supplier;PurchaseId INT FK>Purchase;Amount DECIMAL(12,2);Mode VARCHAR(20);ReferenceNo VARCHAR(40);PaidOn DATE']],
    ['WhatsApp Business', 'API connection, templates, campaigns and every message', [
      'WhatsAppConfig|ConfigId TINYINT PK;Provider VARCHAR(30);DisplayName NVARCHAR(100);BusinessNumber VARCHAR(15);PhoneNumberId VARCHAR(30);WabaId VARCHAR(30);AccessTokenEnc VARBINARY(512);WebhookVerifyToken VARCHAR(60);AutoSendInvoice BIT;AutoSendCreditNote BIT;AutoSendWishes BIT;QuietFrom TIME;QuietTo TIME;IsConnected BIT;UpdatedBy INT FK>AppUser',
      'WhatsAppTemplate|TemplateId INT PK;TemplateName VARCHAR(60) UQ;Category VARCHAR(12);Language VARCHAR(10);HeaderType VARCHAR(10);Body NVARCHAR(1024);Footer NVARCHAR(60);Buttons NVARCHAR(400);ApprovalStatus VARCHAR(12);MetaTemplateId VARCHAR(30);CreatedAt DATETIME2',
      'WhatsAppCampaign|CampaignId INT PK;Name NVARCHAR(100);TemplateId INT FK>WhatsAppTemplate;Segment VARCHAR(30);Variables NVARCHAR(MAX);BranchId INT FK>Branch;ScheduledAt DATETIME2;Status VARCHAR(12);AudienceCount INT;CreatedBy INT FK>AppUser',
      'WhatsAppMessage|MessageId BIGINT PK;Wamid VARCHAR(80) UQ;CustomerId INT FK>Customer;ToNumber VARCHAR(15);TemplateId INT FK>WhatsAppTemplate;CampaignId INT FK>WhatsAppCampaign;InvoiceId BIGINT FK>Invoice;ReturnId INT FK>SalesReturn;MessageType VARCHAR(12);MediaUrl NVARCHAR(400);Status VARCHAR(12);ErrorCode VARCHAR(20);SentAt DATETIME2;DeliveredAt DATETIME2;ReadAt DATETIME2']],
    ['Events', 'Audit trail and customer notifications', [
      'AuditLog|AuditId BIGINT PK;UserId INT FK>AppUser;BranchId INT FK>Branch;Module VARCHAR(20);Action VARCHAR(12);TableName SYSNAME;RecordId VARCHAR(30);OldValues NVARCHAR(MAX);NewValues NVARCHAR(MAX);CreatedAt DATETIME2',
      'NotificationLog|NotificationId BIGINT PK;CustomerId INT FK>Customer;OccasionId INT FK>CustomerOccasion;Channel VARCHAR(10);Template VARCHAR(30);Status VARCHAR(10);SentAt DATETIME2']],
  ];
  parse() {
    if (this._p) return this._p;
    this._p = this.G.map(([name, desc, ts]) => ({ name, desc, tables: ts.map(t => { const [tn, cs] = t.split('|'); return { name: tn, cols: cs.split(';').map(c => { const [cn, type, flags = ''] = c.split(' '); const fk = (flags.match(/FK>(\w+)/) || [])[1]; return { name: cn, type, pk: flags.includes('PK'), uq: flags.includes('UQ'), fk }; }) }; }) }));
    return this._p;
  }
  renderVals() {
    const s = this.state, groups = this.parse(), all = groups.flatMap(g => g.tables);
    const out = {}, inc = {};
    all.forEach(t => t.cols.forEach(c => { if (c.fk) { (out[t.name] = out[t.name] || new Set()).add(c.fk); (inc[c.fk] = inc[c.fk] || new Set()).add(t.name); } }));
    const related = s.sel ? new Set([s.sel, ...(out[s.sel] || []), ...(inc[s.sel] || [])]) : null;
    const q = s.q.trim().toLowerCase();
    const match = t => !q || t.name.toLowerCase().includes(q) || t.cols.some(c => c.name.toLowerCase().includes(q));
    const rels = [];
    if (s.sel) {
      all.find(t => t.name === s.sel).cols.filter(c => c.fk).forEach(c => rels.push({ text: `${s.sel}.${c.name} → ${c.fk}`, card: 'many-to-one' }));
      all.forEach(t => t.cols.forEach(c => { if (c.fk === s.sel && t.name !== s.sel) rels.push({ text: `${t.name}.${c.name} → ${s.sel}`, card: 'one-to-many' }); }));
    }
    const X = [
      ['ph ph-gear-six', 'Stored procedures', [['usp_CreateInvoice', 'One transaction: number from DocumentSequence, insert Invoice + lines + payments, decrement Inventory, write StockMovement, LoyaltyLedger and AuditLog.'], ['usp_ProcessReturn', 'Validates returnable qty, creates SalesReturn + credit note, restocks, reverses loyalty points.'], ['usp_ReceivePurchase · usp_TransferStock · usp_AdjustStock', 'Post stock in/out with movements; block negative stock.'], ['usp_GetNextDocNo', 'UPDLOCK on DocumentSequence for gap-free invoice numbers per branch and FY.']]],
      ['ph ph-eye', 'Views', [['vw_StockByBranch', 'Pivot of QtyOnHand per item and branch with reorder flag.'], ['vw_DailySales · vw_PaymentModeSplit', 'Feeds the dashboard and sales reports.'], ['vw_GSTR1_HSN', 'HSN- and rate-wise taxable value, CGST/SGST/IGST for GST filing.'], ['vw_UpcomingOccasions', 'Birthdays, anniversaries and weddings in the next 30 days.']]],
      ['ph ph-lightning', 'Triggers', [['trg_Audit_*', 'AFTER UPDATE/DELETE on Customer, Product, ProductItem, Invoice, Supplier — writes old/new values as JSON to AuditLog.'], ['trg_Customer_Occasion', 'Keeps CustomerOccasion in sync with DateOfBirth and AnniversaryDate.']]],
      ['ph ph-list-magnifying-glass', 'Indexes', [['IX_Invoice_Branch_Date', '(BranchId, InvoiceDate) INCLUDE (NetAmount, Status)'], ['IX_InvoiceLine_Item · IX_StockMovement_Item_Date', 'Item history and top-seller reports.'], ['UQ_ProductItem_Barcode · UQ_Customer_Mobile', 'Fast scan lookup and customer search at the counter.']]],
      ['ph ph-whatsapp-logo', 'WhatsApp service (outside SQL)', [['Notification worker (.NET / Node)', 'Reads a queue table, renders the invoice PDF, uploads media and calls the WhatsApp Cloud API or your provider.'], ['Webhook endpoint', 'Receives sent / delivered / read / failed events and opt-outs, then updates WhatsAppMessage and Customer.WhatsAppOptIn.'], ['usp_QueueWhatsApp', 'Called from usp_CreateInvoice / usp_ProcessReturn when auto-send is on and the customer has opted in.']]],
      ['ph ph-clock-clockwise', 'SQL Agent jobs', [['Nightly full + 15-min log backups', 'Point-in-time recovery for billing data.'], ['Daily 9 am · occasion queue', 'Fills NotificationLog for opted-in customers 7 days ahead.'], ['Monthly · tier recalculation', 'Silver / Gold / Platinum from 12-month spend.']]],
      ['ph ph-lock-key', 'Security', [['Database roles', 'db_cashier, db_manager, db_inventory, db_admin. The app calls procedures only, with no direct table writes.'], ['Row-level security', 'Branch staff see only their BranchId; owners see all.'], ['Encryption', 'TDE on the database, hashed passwords, TLS from the app.']]],
    ];
    return {
      tableCount: all.length, q: s.q, onQ: e => this.setState({ q: e.target.value }),
      hasSel: !!s.sel, selName: s.sel, clearSel: () => this.setState({ sel: null }), rels,
      groups: groups.map(g => ({ name: g.name, desc: g.desc, tables: g.tables.map(t => {
        const isSel = t.name === s.sel, rel = related && related.has(t.name), dim = (related && !rel) || !match(t);
        return { name: t.name, n: t.cols.length, op: dim ? 0.3 : 1,
          ring: isSel ? '0 0 0 1px var(--color-accent), 0 0 28px -8px var(--color-accent)' : rel ? '0 0 0 1px var(--color-accent-700)' : 'var(--shadow-sm)',
          pick: () => this.setState({ sel: isSel ? null : t.name }),
          cols: t.cols.map(c => {
            const hl = (s.sel && c.fk === s.sel) || (isSel && c.fk && related) || (q && c.name.toLowerCase().includes(q));
            return { name: c.name, type: c.type, ref: c.fk ? ' → ' + c.fk : '', key: c.pk ? 'PK' : c.fk ? 'FK' : c.uq ? 'UQ' : '', keyVis: c.pk || c.fk || c.uq ? 'visible' : 'hidden',
              keyClass: c.pk ? 'tag tag-accent' : c.fk ? 'tag tag-outline' : 'tag tag-neutral', bg: hl ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : 'transparent' };
          }) };
      }) })),
      extras: X.map(([icon, title, items]) => ({ icon, title, items: items.map(([k, v]) => ({ k, v })) })),
    };
  }

  template($v: any) {
    return (
      <>
      <div className={styles.box1}>
        <main className={styles.main1}>
          <header className={styles.header1}>
            <div>
              <div className={styles.box2}>System · SQL Server back end</div>
              <h1 className={styles.title1}>Database schema</h1>
              <div className={styles.box3}>
                {$v.tableCount} tables in 8 modules. Select a table to highlight the tables it references and the tables that reference it.
              </div>
            </div>
            <div className={styles.box4}>
              <div className={styles.box5}>
                <i className={`ph ph-magnifying-glass ${styles.icon1}`} />
                <input className={styles.field1} value={$v.q} onChange={$v.onQ} placeholder="Find table or column" />
              </div>
              {$v.hasSel ? (
                <>
                  <button className="btn btn-secondary" onClick={$v.clearSel}>
                    <i className="ph ph-x" />
                    Clear selection
                  </button>
                </>
              ) : null}
            </div>
          </header>
          <div className={styles.box6}>
            <span className={styles.text1}>
              <span className={`tag tag-accent ${styles.text2}`}>PK</span>
              Primary key
            </span>
            <span className={styles.text1}>
              <span className={`tag tag-outline ${styles.text3}`}>FK</span>
              Foreign key
            </span>
            <span className={styles.text1}>
              <span className={`tag tag-neutral ${styles.text2}`}>UQ</span>
              Unique index
            </span>
          </div>
          {$v.hasSel ? (
            <>
              <div className={`card ${styles.box7}`}>
                <div className="card-kicker">Relationships · {$v.selName}</div>
                <div className={styles.box8}>
                  {($v.rels || []).map((r: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <div className={styles.box9}>
                        {r?.text}{" "}
                        <span className={styles.text4}>{r?.card}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          ) : null}
          {($v.groups || []).map((g: any, $index: number) => (
            <React.Fragment key={$index}>
              <section className={styles.section1}>
                <div className={styles.box10}>
                  <h2 className={styles.title2}>{g?.name}</h2>
                  <span className={styles.text5}>{g?.desc}</span>
                </div>
                <div className={styles.box11}>
                  {(g?.tables || []).map((t: any, $index: number) => (
                    <React.Fragment key={$index}>
                      <div className={styles.box12} onClick={t?.pick} style={{ boxShadow: t?.ring, opacity: t?.op }}>
                        <div className={styles.box13}>
                          <span className={styles.text6}>dbo.{t?.name}</span>
                          <span className={styles.text7}>{t?.n} cols</span>
                        </div>
                        <div className={styles.box14}>
                          {(t?.cols || []).map((c: any, $index: number) => (
                            <React.Fragment key={$index}>
                              <div className={styles.box15} style={{ background: c?.bg }}>
                                <span className={`${c?.keyClass ?? ''} ${styles.text8}`} style={{ visibility: c?.keyVis }}>{c?.key}</span>
                                <span className={styles.text9}>
                                  {c?.name}
                                  <span className={styles.icon1}>{c?.ref}</span>
                                </span>
                                <span className={styles.text10}>{c?.type}</span>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </section>
            </React.Fragment>
          ))}
          <section className={styles.section2}>
            <div className={styles.box10}>
              <h2 className={styles.title2}>Also needed on the server</h2>
              <span className={styles.text5}>Logic that keeps billing consistent</span>
            </div>
            <div className={styles.box16}>
              {($v.extras || []).map((x: any, $index: number) => (
                <React.Fragment key={$index}>
                  <div className={`card ${styles.box17}`}>
                    <div className={styles.box18}>
                      <i className={`${x?.icon ?? ''} ${styles.icon2}`} />
                      <span className={`card-title ${styles.text11}`}>{x?.title}</span>
                    </div>
                    {(x?.items || []).map((i: any, $index: number) => (
                      <React.Fragment key={$index}>
                        <div className={styles.box19}>
                          <span className={styles.text12}>{i?.k}</span>
                          <div className={styles.box20}>{i?.v}</div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </section>
        </main>
      </div>
      </>
    );
  }
}
