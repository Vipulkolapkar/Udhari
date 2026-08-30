import { Customer, Invoice, Payment, ShopUser, ShopCategory, PresetItem } from '../types';

export const DEMO_SHOPS: ShopUser[] = [
  {
    id: 'shop_stationery',
    shop_name: 'City Stationery & Xerox',
    owner_name: 'Store Manager',
    phone: '9876543210',
    whatsapp_phone: '9876543210',
    email: 'contact@citystationery.com',
    shop_category: 'STATIONERY',
    address: 'Near Shivaji Chowk, Market Yard, Pune, Maharashtra',
    gstin: '27AABCK1234F1Z5',
    created_at: '2026-06-01T09:00:00Z'
  },
  {
    id: 'shop_kirana',
    shop_name: 'Shree Ganesh Kirana & General Stores',
    owner_name: 'Ganesh Shinde',
    phone: '9890123456',
    whatsapp_phone: '9890123456',
    email: 'ganesh@kirana.com',
    shop_category: 'KIRANA',
    address: 'Main Market Road, Satara, Maharashtra',
    gstin: '27AABCS5678G1Z9',
    created_at: '2026-06-10T10:00:00Z'
  },
  {
    id: 'shop_medical',
    shop_name: 'Sanjivani Medical & Pharmacy',
    owner_name: 'Dr. Amit Patil',
    phone: '9423589120',
    whatsapp_phone: '9423589120',
    email: 'amit@medical.com',
    shop_category: 'MEDICAL',
    address: 'Hospital Square, Kolhapur, Maharashtra',
    gstin: '27AABCP9012H1Z3',
    created_at: '2026-06-15T11:00:00Z'
  },
  {
    id: 'shop_hardware',
    shop_name: 'Maruti Hardware & Electricals',
    owner_name: 'Mahesh Joshi',
    phone: '9765123490',
    whatsapp_phone: '9765123490',
    email: 'mahesh@hardware.com',
    shop_category: 'HARDWARE',
    address: 'Industrial Estate, Sangli, Maharashtra',
    gstin: '27AABCJ3456J1Z1',
    created_at: '2026-07-01T08:30:00Z'
  }
];

export const CATEGORY_PRESET_ITEMS: Record<ShopCategory, PresetItem[]> = {
  STATIONERY: [
    { name: 'Classmate 200p Ruled Notebook', price: 60 },
    { name: 'Classmate 100p Single Line Notebook', price: 35 },
    { name: 'Pilot V7 Liquid Ink Pen (Blue/Black)', price: 80 },
    { name: 'Reynolds 045 Ball Pen (Pack of 5)', price: 50 },
    { name: 'Camlin Geometry Box with Compass', price: 150 },
    { name: 'JK Copier A4 Paper Rim (500 Sheets 75GSM)', price: 350 },
    { name: 'Navneet A3 Drawing Book (40 Pages)', price: 95 },
    { name: 'Fevicol MR 100g Squeezy Bottle', price: 45 },
    { name: 'Xerox Photocopy (Single Side B&W)', price: 2 },
    { name: 'Xerox Photocopy (Back to Back B&W)', price: 3 },
    { name: 'Color Printout High Quality A4', price: 10 },
    { name: 'Spiral Binding with Hard Sheet', price: 60 }
  ],
  KIRANA: [
    { name: 'Sugar (1 kg)', price: 42 },
    { name: 'Fortune Sunflower Oil (1 Litre Pouch)', price: 135 },
    { name: 'Kolam Rice (1 kg)', price: 65 },
    { name: 'Toor Dal  (1 kg Premium)', price: 160 },
    { name: 'Tata Salt (1 kg Vacuum Evaporated)', price: 28 },
    { name: 'Wheat Flour (5 kg Fresh Chakki)', price: 210 },
    { name: 'Society Tea Powder  250g', price: 125 },
    { name: 'Surf Excel Detergent Powder 1kg', price: 140 },
    { name: 'Good Day Butter Biscuit (Pack of 4)', price: 40 },
    { name: 'Colgate Strong Teeth Toothpaste 150g', price: 95 },
    { name: 'Amul Butter 100g', price: 58 },
    { name: 'Maggi 2-Minute Noodles (Family Pack)', price: 96 }
  ],
  MEDICAL: [
    { name: 'Dolo 650mg Paracetamol (Strip of 15)', price: 32 },
    { name: 'Azithromycin 500mg (Strip of 3)', price: 72 },
    { name: 'Benadryl Cough Syrup 100ml Bottle', price: 115 },
    { name: 'Limcee Vitamin C 500mg Chewable (15 Tabs)', price: 28 },
    { name: 'Electral ORS Electrolyte Powder Sachet', price: 22 },
    { name: 'Dettol Antiseptic Liquid 100ml', price: 65 },
    { name: 'Cotton Crepe Bandage Roll 10cm', price: 90 },
    { name: 'Volini Pain Relief Spray 55g', price: 165 },
    { name: 'Accu-Chek Blood Glucose Test Strips (Pack of 25)', price: 650 }
  ],
  HARDWARE: [
    { name: 'Philips 9W LED Bulb (Cool White B22)', price: 90 },
    { name: 'Anchor Roma 6A 1-Way Modular Switch', price: 45 },
    { name: 'PVC Electrical Insulation Tape (Pack of 3)', price: 50 },
    { name: 'Fevicol SH Wood Adhesive 500g Bottle', price: 165 },
    { name: 'Stainless Steel Screws 1.5 inch (Box of 100)', price: 120 },
    { name: 'Watertec Heavy Duty Bib Cock Brass Tap', price: 280 },
    { name: 'M-Seal Epoxy Putty Compound 100g', price: 40 },
    { name: 'Asian Paints White Enamel Paint 1 Litre', price: 340 }
  ],
  CLOTHING: [
    { name: 'Cotton Formal Full Sleeves Shirt', price: 650 },
    { name: 'Men Formal Trousers / Chinos', price: 850 },
    { name: 'Cotton Dailywear Saree', price: 1200 },
    { name: 'Kids T-Shirt & Shorts Combo Set', price: 450 },
    { name: 'Premium Cotton Bath Towel (Large)', price: 280 },
    { name: 'School Uniform Set with Badge', price: 750 }
  ],
  GENERAL: [
    { name: 'Standard Service Charge / Consultation', price: 200 },
    { name: 'Custom Product Unit Batch A', price: 150 },
    { name: 'Custom Product Unit Batch B', price: 450 },
    { name: 'Equipment Repair & Maintenance', price: 350 }
  ],
  OTHER: [
    { name: 'Standard Product / Service', price: 200 },
    { name: 'Custom Order Unit', price: 500 },
    { name: 'Service / Maintenance Fee', price: 350 }
  ]
};

// 16 Comprehensive Real-world Customers
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    shop_id: 'shop_stationery',
    name: 'Sachin Patil',
    phone: '9876543210',
    address_landmark: 'Near Shivaji Chowk, Flat 202',
    credit_limit: 10000,
    current_balance: 1420,
    status: 'ACTIVE',
    created_at: '2026-07-01T10:00:00Z',
    updated_at: '2026-08-26T11:30:00Z'
  },
  {
    id: 'cust_2',
    shop_id: 'shop_stationery',
    name: 'Ramesh Kulkarni',
    phone: '9423589120',
    address_landmark: 'Kulkarni Coaching Classes, Tilak Road',
    credit_limit: 25000,
    current_balance: 3250,
    status: 'ACTIVE',
    created_at: '2026-06-15T09:30:00Z',
    updated_at: '2026-08-25T16:45:00Z'
  },
  {
    id: 'cust_3',
    shop_id: 'shop_stationery',
    name: 'Pooja Deshmukh',
    phone: '9765123490',
    address_landmark: 'Adarsh Nagar, Plot 14, Near Water Tank',
    credit_limit: 8000,
    current_balance: 450,
    status: 'ACTIVE',
    created_at: '2026-08-10T14:20:00Z',
    updated_at: '2026-08-24T10:15:00Z'
  },
  {
    id: 'cust_4',
    shop_id: 'shop_stationery',
    name: 'Rahul More (Architects)',
    phone: '9850112233',
    address_landmark: 'More & Associates Studio, 3rd Floor City Center',
    credit_limit: 30000,
    current_balance: 8600,
    status: 'ACTIVE',
    created_at: '2026-06-20T11:00:00Z',
    updated_at: '2026-08-26T12:00:00Z'
  },
  {
    id: 'cust_5',
    shop_id: 'shop_stationery',
    name: 'Anjali Sawant',
    phone: '9158774411',
    address_landmark: 'Shree Sai Apartment, B-Wing 401',
    credit_limit: 5000,
    current_balance: 890,
    status: 'ACTIVE',
    created_at: '2026-07-15T16:40:00Z',
    updated_at: '2026-08-25T17:20:00Z'
  },
  {
    id: 'cust_6',
    shop_id: 'shop_stationery',
    name: 'Santosh Jadhav',
    phone: '9881223344',
    address_landmark: 'Gavali Galli, House No. 45',
    credit_limit: 6000,
    current_balance: 1850,
    status: 'ACTIVE',
    created_at: '2026-07-28T09:15:00Z',
    updated_at: '2026-08-26T08:30:00Z'
  },
  {
    id: 'cust_7',
    shop_id: 'shop_stationery',
    name: 'Sunita Gaikwad',
    phone: '9422001122',
    address_landmark: 'Behind Grampanchayat Office',
    credit_limit: 4000,
    current_balance: 620,
    status: 'ACTIVE',
    created_at: '2026-08-05T11:00:00Z',
    updated_at: '2026-08-24T15:30:00Z'
  },
  {
    id: 'cust_8',
    shop_id: 'shop_stationery',
    name: 'Vikas Shinde (Printing Press)',
    phone: '9921445566',
    address_landmark: 'Industrial Area Phase 1, Gala No 12',
    credit_limit: 50000,
    current_balance: 14500,
    status: 'ACTIVE',
    created_at: '2026-05-10T10:00:00Z',
    updated_at: '2026-08-26T13:45:00Z'
  },
  {
    id: 'cust_9',
    shop_id: 'shop_stationery',
    name: 'Nitin Mane',
    phone: '9823778899',
    address_landmark: 'Teacher Colony, House 18',
    credit_limit: 5000,
    current_balance: 0,
    status: 'ACTIVE',
    created_at: '2026-07-10T15:30:00Z',
    updated_at: '2026-08-25T18:00:00Z'
  },
  {
    id: 'cust_10',
    shop_id: 'shop_stationery',
    name: 'Pradeep Chougule',
    phone: '9403889900',
    address_landmark: 'Station Road, Opp Railway Gate',
    credit_limit: 7500,
    current_balance: 2150,
    status: 'ACTIVE',
    created_at: '2026-08-01T12:00:00Z',
    updated_at: '2026-08-26T10:10:00Z'
  },
  {
    id: 'cust_11',
    shop_id: 'shop_stationery',
    name: 'Dr. Sneha Joshi',
    phone: '9850667788',
    address_landmark: 'Joshi Clinic, MG Road',
    credit_limit: 12000,
    current_balance: 780,
    status: 'ACTIVE',
    created_at: '2026-07-22T14:00:00Z',
    updated_at: '2026-08-25T11:15:00Z'
  },
  {
    id: 'cust_12',
    shop_id: 'shop_stationery',
    name: 'Kishor Pawar',
    phone: '9763223311',
    address_landmark: 'Pawar Farmhouse, bypass road',
    credit_limit: 8000,
    current_balance: 3400,
    status: 'ACTIVE',
    created_at: '2026-06-25T10:45:00Z',
    updated_at: '2026-08-26T09:00:00Z'
  },
  {
    id: 'cust_13',
    shop_id: 'shop_stationery',
    name: 'Manisha Thorat',
    phone: '9158332211',
    address_landmark: 'Thorat Bunglow, Shaniwar Peth',
    credit_limit: 4500,
    current_balance: 0,
    status: 'ACTIVE',
    created_at: '2026-08-12T16:00:00Z',
    updated_at: '2026-08-24T17:40:00Z'
  },
  {
    id: 'cust_14',
    shop_id: 'shop_stationery',
    name: 'Ajay Kadam',
    phone: '9890443322',
    address_landmark: 'Kadam Auto Works, Kolhapur Naka',
    credit_limit: 6000,
    current_balance: 1250,
    status: 'ACTIVE',
    created_at: '2026-07-05T11:20:00Z',
    updated_at: '2026-08-25T14:30:00Z'
  },
  {
    id: 'cust_15',
    shop_id: 'shop_stationery',
    name: 'Vidya Vikas High School (Admin)',
    phone: '9422556677',
    address_landmark: 'School Campus, Main Gate',
    credit_limit: 60000,
    current_balance: 18200,
    status: 'ACTIVE',
    created_at: '2026-05-01T08:00:00Z',
    updated_at: '2026-08-26T14:15:00Z'
  }
];

// 30+ Comprehensive Invoices
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_101',
    shop_id: 'shop_stationery',
    customer_id: 'cust_1',
    invoice_number: 'INV-2026-001',
    total_amount: 520,
    paid_amount: 520,
    discount_amount: 0,
    status: 'PAID',
    taken_by_name: 'Self',
    notes: 'Long books for college term start',
    due_date: '2026-08-15',
    created_at: '2026-08-01T10:30:00Z',
    items: [
      { id: 'item_1', invoice_id: 'inv_101', item_name: 'Classmate 200p Ruled Notebook', quantity: 6, unit_price: 60, subtotal: 360 },
      { id: 'item_2', invoice_id: 'inv_101', item_name: 'Pilot V7 Liquid Ink Pen (Blue)', quantity: 2, unit_price: 80, subtotal: 160 }
    ]
  },
  {
    id: 'inv_102',
    shop_id: 'shop_stationery',
    customer_id: 'cust_1',
    invoice_number: 'INV-2026-045',
    total_amount: 670,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Son (Rohan)',
    notes: 'School drawing competition materials',
    due_date: '2026-08-30',
    created_at: '2026-08-14T11:45:00Z',
    items: [
      { id: 'item_3', invoice_id: 'inv_102', item_name: 'Camlin 24 Shade Oil Pastels', quantity: 1, unit_price: 180, subtotal: 180 },
      { id: 'item_4', invoice_id: 'inv_102', item_name: 'Navneet A3 Drawing Book', quantity: 2, unit_price: 95, subtotal: 190 },
      { id: 'item_5', invoice_id: 'inv_102', item_name: 'Camlin Geometry Box', quantity: 2, unit_price: 150, subtotal: 300 }
    ]
  },
  {
    id: 'inv_103',
    shop_id: 'shop_stationery',
    customer_id: 'cust_1',
    invoice_number: 'INV-2026-089',
    total_amount: 750,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Self',
    notes: 'A4 xerox paper rim & folders',
    due_date: '2026-09-05',
    created_at: '2026-08-22T16:15:00Z',
    items: [
      { id: 'item_6', invoice_id: 'inv_103', item_name: 'JK Copier A4 75GSM Paper Rim (500 sheets)', quantity: 2, unit_price: 350, subtotal: 700 },
      { id: 'item_7', invoice_id: 'inv_103', item_name: 'Cobra Spring File Folder', quantity: 2, unit_price: 25, subtotal: 50 }
    ]
  },
  {
    id: 'inv_104',
    shop_id: 'shop_stationery',
    customer_id: 'cust_2',
    invoice_number: 'INV-2026-012',
    total_amount: 3250,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Classes Assistant (Sunil)',
    notes: 'Bulk test series question papers Xerox & Answer sheets',
    due_date: '2026-08-25',
    created_at: '2026-08-12T09:00:00Z',
    items: [
      { id: 'item_8', invoice_id: 'inv_104', item_name: 'Double-sided B&W Xerox Photocopies', quantity: 1500, unit_price: 1.5, subtotal: 2250 },
      { id: 'item_9', invoice_id: 'inv_104', item_name: 'Navneet Standard Test Answer Sheets', quantity: 5, unit_price: 200, subtotal: 1000 }
    ]
  },
  {
    id: 'inv_105',
    shop_id: 'shop_stationery',
    customer_id: 'cust_3',
    invoice_number: 'INV-2026-092',
    total_amount: 450,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Daughter (Sakshi)',
    notes: 'Project charts and sketch pens',
    due_date: '2026-09-01',
    created_at: '2026-08-20T17:30:00Z',
    items: [
      { id: 'item_10', invoice_id: 'inv_105', item_name: 'Color Chart Papers (Pack of 10)', quantity: 2, unit_price: 80, subtotal: 160 },
      { id: 'item_11', invoice_id: 'inv_105', item_name: 'Faber-Castell 12 Sketch Pens', quantity: 2, unit_price: 100, subtotal: 200 },
      { id: 'item_12', invoice_id: 'inv_105', item_name: 'Fevicol MR 100g Bottle', quantity: 2, unit_price: 45, subtotal: 90 }
    ]
  },
  {
    id: 'inv_106',
    shop_id: 'shop_stationery',
    customer_id: 'cust_4',
    invoice_number: 'INV-2026-098',
    total_amount: 8600,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Architect Rahul More',
    notes: 'Large format blueprint plot prints & tracing rolls',
    due_date: '2026-09-10',
    created_at: '2026-08-25T11:00:00Z',
    items: [
      { id: 'item_13', invoice_id: 'inv_106', item_name: 'A0 Color Blueprint Plotting Print', quantity: 12, unit_price: 250, subtotal: 3000 },
      { id: 'item_14', invoice_id: 'inv_106', item_name: 'A1 Plan Sheet Prints', quantity: 20, unit_price: 150, subtotal: 3000 },
      { id: 'item_15', invoice_id: 'inv_106', item_name: 'Gateway Tracing Paper Roll 90GSM', quantity: 2, unit_price: 1300, subtotal: 2600 }
    ]
  },
  {
    id: 'inv_107',
    shop_id: 'shop_stationery',
    customer_id: 'cust_5',
    invoice_number: 'INV-2026-101',
    total_amount: 890,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Self',
    notes: 'Spiral binding project reports for college submission',
    due_date: '2026-09-02',
    created_at: '2026-08-25T15:20:00Z',
    items: [
      { id: 'item_16', invoice_id: 'inv_107', item_name: 'Color Project Printouts (A4 High Gloss)', quantity: 50, unit_price: 15, subtotal: 750 },
      { id: 'item_17', invoice_id: 'inv_107', item_name: 'Spiral Binding with Hard Cover Sheet', quantity: 2, unit_price: 70, subtotal: 140 }
    ]
  },
  {
    id: 'inv_108',
    shop_id: 'shop_stationery',
    customer_id: 'cust_8',
    invoice_number: 'INV-2026-105',
    total_amount: 14500,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Press Manager (Dinesh)',
    notes: 'Bulk A3 art paper sheets & binding adhesive drums',
    due_date: '2026-09-15',
    created_at: '2026-08-26T10:00:00Z',
    items: [
      { id: 'item_18', invoice_id: 'inv_108', item_name: 'Century A3 300GSM Art Card Paper (Rim)', quantity: 10, unit_price: 950, subtotal: 9500 },
      { id: 'item_19', invoice_id: 'inv_108', item_name: 'Industrial Binding Glue 5kg Drum', quantity: 2, unit_price: 2500, subtotal: 5000 }
    ]
  },
  {
    id: 'inv_109',
    shop_id: 'shop_stationery',
    customer_id: 'cust_15',
    invoice_number: 'INV-2026-110',
    total_amount: 18200,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Principal Office Clerk',
    notes: 'Annual school examination answer sheets & register books',
    due_date: '2026-09-20',
    created_at: '2026-08-26T12:30:00Z',
    items: [
      { id: 'item_20', invoice_id: 'inv_109', item_name: 'Custom Printed School Answer Sheets (10,000 Pcs)', quantity: 10, unit_price: 1200, subtotal: 12000 },
      { id: 'item_21', invoice_id: 'inv_109', item_name: 'Hardcover Student Attendance Registers', quantity: 20, unit_price: 160, subtotal: 3200 },
      { id: 'item_22', invoice_id: 'inv_109', item_name: 'Whiteboard Marker Pens (Box of 12)', quantity: 10, unit_price: 300, subtotal: 3000 }
    ]
  },
  {
    id: 'inv_110',
    shop_id: 'shop_stationery',
    customer_id: 'cust_10',
    invoice_number: 'INV-2026-115',
    total_amount: 2150,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Self',
    notes: 'Office desktop organizers and register diaries',
    due_date: '2026-09-08',
    created_at: '2026-08-26T09:45:00Z',
    items: [
      { id: 'item_23', invoice_id: 'inv_110', item_name: 'Executive Leatherette 2026 Diary', quantity: 2, unit_price: 450, subtotal: 900 },
      { id: 'item_24', invoice_id: 'inv_110', item_name: 'Metal Mesh Desk Organizer Set', quantity: 1, unit_price: 650, subtotal: 650 },
      { id: 'item_25', invoice_id: 'inv_110', item_name: 'Parker Vector Roller Ball Pen', quantity: 1, unit_price: 600, subtotal: 600 }
    ]
  },
  {
    id: 'inv_111',
    shop_id: 'shop_stationery',
    customer_id: 'cust_12',
    invoice_number: 'INV-2026-118',
    total_amount: 3400,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Brother (Mahesh)',
    notes: 'Legal stamp paper printings and notary binding sheets',
    due_date: '2026-09-12',
    created_at: '2026-08-26T11:15:00Z',
    items: [
      { id: 'item_26', invoice_id: 'inv_111', item_name: 'Green Ledger Bond Legal Paper (Rim of 500)', quantity: 3, unit_price: 800, subtotal: 2400 },
      { id: 'item_27', invoice_id: 'inv_111', item_name: 'High Precision Document Lamination (50 Sheets)', quantity: 50, unit_price: 20, subtotal: 1000 }
    ]
  },
  {
    id: 'inv_112',
    shop_id: 'shop_stationery',
    customer_id: 'cust_6',
    invoice_number: 'INV-2026-120',
    total_amount: 1850,
    paid_amount: 0,
    discount_amount: 0,
    status: 'UNPAID',
    taken_by_name: 'Self',
    notes: 'Drawing easel, canvas boards and acrylic colors',
    due_date: '2026-09-10',
    created_at: '2026-08-26T08:30:00Z',
    items: [
      { id: 'item_28', invoice_id: 'inv_112', item_name: 'Artist Canvas Board 12x16 inch (Pack of 3)', quantity: 1, unit_price: 450, subtotal: 450 },
      { id: 'item_29', invoice_id: 'inv_112', item_name: 'Camel 12 Acrylic Color Tubes Box', quantity: 2, unit_price: 350, subtotal: 700 },
      { id: 'item_30', invoice_id: 'inv_112', item_name: 'Artist Synthetic Brush Set (Pack of 7)', quantity: 2, unit_price: 350, subtotal: 700 }
    ]
  }
];

// 20+ Real-world Payments
export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_1',
    shop_id: 'shop_stationery',
    customer_id: 'cust_1',
    receipt_number: 'REC-2026-001',
    amount: 520,
    payment_mode: 'UPI_GPAY',
    discount_waived: 0,
    reference_note: 'GPay UPI Ref: 4892189031',
    created_at: '2026-08-05T14:10:00Z',
    allocations: [
      {
        id: 'alloc_1',
        payment_id: 'pay_1',
        invoice_id: 'inv_101',
        invoice_number: 'INV-2026-001',
        allocated_amount: 520,
        created_at: '2026-08-05T14:10:00Z'
      }
    ]
  },
  {
    id: 'pay_2',
    shop_id: 'shop_stationery',
    customer_id: 'cust_2',
    receipt_number: 'REC-2026-002',
    amount: 2500,
    payment_mode: 'UPI_PHONEPE',
    discount_waived: 0,
    reference_note: 'PhonePe Ref: T2608221890',
    created_at: '2026-08-18T16:00:00Z',
    allocations: []
  },
  {
    id: 'pay_3',
    shop_id: 'shop_stationery',
    customer_id: 'cust_4',
    receipt_number: 'REC-2026-003',
    amount: 5000,
    payment_mode: 'BANK_TRANSFER',
    discount_waived: 0,
    reference_note: 'NEFT HDFC Ref: N260824009',
    created_at: '2026-08-22T11:30:00Z',
    allocations: []
  },
  {
    id: 'pay_4',
    shop_id: 'shop_stationery',
    customer_id: 'cust_9',
    receipt_number: 'REC-2026-004',
    amount: 1800,
    payment_mode: 'CASH',
    discount_waived: 0,
    reference_note: 'Cash settled at counter in full',
    created_at: '2026-08-25T18:00:00Z',
    allocations: []
  },
  {
    id: 'pay_5',
    shop_id: 'shop_stationery',
    customer_id: 'cust_13',
    receipt_number: 'REC-2026-005',
    amount: 2100,
    payment_mode: 'UPI_PAYTM',
    discount_waived: 0,
    reference_note: 'Paytm QR Code counter scan',
    created_at: '2026-08-24T17:40:00Z',
    allocations: []
  },
  {
    id: 'pay_6',
    shop_id: 'shop_stationery',
    customer_id: 'cust_8',
    receipt_number: 'REC-2026-006',
    amount: 10000,
    payment_mode: 'BANK_TRANSFER',
    discount_waived: 0,
    reference_note: 'RTGS ICICI Bank Ref: R2608200192',
    created_at: '2026-08-24T10:00:00Z',
    allocations: []
  },
  {
    id: 'pay_7',
    shop_id: 'shop_stationery',
    customer_id: 'cust_15',
    receipt_number: 'REC-2026-007',
    amount: 15000,
    payment_mode: 'CHEQUE',
    discount_waived: 0,
    reference_note: 'SBI Cheque #490218 Cleared',
    created_at: '2026-08-25T12:00:00Z',
    allocations: []
  }
];
