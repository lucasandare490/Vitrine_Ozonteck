-- Exact BRL values supplied in the owner's 12 screenshots; no percentage inference.
-- Existing admin edits are preserved on rerun. Missing/deleted products are ignored.
begin;
insert into public.affiliate_prices(product_code,price)
select p.code, source.price from (values
 ('PERF-CAPA',15.00),('PERF-CIND',15.00),('PERF-DG',15.00),('PERF-GREC',15.00),
 ('PERF-FERA',15.00),('PERF-MAXIMUM',15.00),('PERF-PRESIDENTE',15.00),('PERF-SENTIMENTO',15.00),
 ('PERF-VIP-GIRL',15.00),('PERF-SOBERANO',15.00),('PERF-VG',15.00),('PERF-SPEED',15.00),
 ('PERF-303-VIP',15.00),('PERF-MAX-B',15.00),('PERF-303-M',15.00),('PERF-ALEM',15.00),
 ('PERF-FANT',15.00),('PERF-VENUM',15.00),('PERF-VIDA',15.00),('PERF-SEDUC',15.00),
 ('PERF-GOUF-B',15.00),('PERF-303-W',15.00),('PERF-ANGE',15.00),('PERF-BLUE',15.00),
 ('PERF-FAMMA',15.00),('PERF-EASY',15.00),('PERF-GOUF-T',15.00),('PERF-MAD',15.00),
 ('PERF-SCAN',15.00),('PERF-DOCU',15.00),('PERF-AVEN',15.00),('PERF-SOUL',15.00),
 ('PERF-SUPREMO',15.00),('PERF-LABOOM',15.00),
 ('PERF-AALI',18.00),('PERF-SUBLI',18.00),('PERF-RHINO',18.00),('PERF-OUD',18.00),
 ('PERF-FER-VE',59.95),('PERF-LUA-VE',59.95),
 ('P100-SPEED',89.95),('P100-MADAME',89.95),('P100-CIND',89.95),('P100-VG',89.95),
 ('P100-MAXBOSS',89.95),('P100-PRES',89.95),('P100-SENT',89.95),('P100-SOB',89.95),
 ('P100-VIDA',89.95),('P100-SCAN',89.95),
 ('P100-SUBLIME',99.95),('P100-RHINO',99.95),('P100-AALIYAH',99.95),('P100-OUD',99.95),
 ('NUT-NXCAP',79.96),('NUT-OMEGA',79.95),('NUT-TRIMAG',79.95),('NUT-XBOOST',69.95),
 ('NUT-BORYS',69.95),('NUT-VIRT',69.95),('NUT-VITA-OZ',69.95),('NUT-DREAM',87.95),
 ('NUT-K2D3',79.95),('NUT-LUMI',79.95),('NUT-SOFH-D',59.95),('NUT-MELAT',79.90),
 ('NUT-COBAL',89.85),('NUT-GENO',89.85),('NUT-OX',89.85),
 ('NUT-FLEX-CX',99.90),('NUT-FLEX-UN',3.33),('NUT-LEV-UN',3.33),
 ('NUT-CREAT-CX',99.90),('NUT-CREAT-UN',3.33),('NUT-CREAT-MO-CX',99.90),('NUT-CREAT-MO-UN',3.33),
 ('BE-SOFH',44.90),('BE-OX3',49.95),('BE-SHII',79.95),('BE-LUSH',59.95),
 ('BE-FRESH',29.95),('BE-PURE',29.95),('BE-TRIX',39.95),('BE-HAY',79.95),
 ('BE-HID-SB',39.95),('BE-HID-VG',39.95),
 ('CAP-AMP-SF',39.95),('CAP-SH-OK',54.95),('CAP-MAS-OK',59.95),('CAP-CO-KES',54.95),
 ('CAP-O-ACAI',52.50),('CAP-O-CREAM',79.95),('CAP-FOR-MEN',54.95),('CAP-TON',59.95),
 ('CAP-MAS-BL',59.95),('CAP-SH-BL',54.95),('CAP-SH-MC',54.95),('CAP-MAS-MC',59.95),
 ('CAP-AT-MC',59.95),('CAP-SH-MEL',54.95),('CAP-CO-MEL',54.95),('CAP-MAS-MEL',59.95),
 ('CAP-KIDS-SH',54.95),('CAP-KIDS-CO',54.95),('CAP-KIDS-LE',59.95)
) as source(code,price) join public.produtos p on p.code = source.code
where not coalesce(p.is_deleted,false)
on conflict(product_code) do nothing;
commit;
