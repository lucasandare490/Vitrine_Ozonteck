# Símbolos de pagamento

Obtidos em 03/11/2026 do campo `secure_thumbnail` da consulta autenticada
`GET https://api.mercadopago.com/v1/payment_methods`. Visa, Mastercard,
American Express, Elo, Pix e boleto retornaram `active` para a conta configurada.
Consulta somente de leitura, sem criação de pagamentos.

As marcas pertencem aos respectivos titulares. Os arquivos são usados para
identificar os meios de pagamento, sem alteração da arte.

- visa.png: https://http2.mlstatic.com/storage/logos-api-admin/d589be70-eb86-11e9-b9a8-097ac027487d-xl.png
- master.png: https://http2.mlstatic.com/storage/logos-api-admin/0daa1670-5c81-11ec-ae75-df2bef173be2-xl.png
- elo.png: https://http2.mlstatic.com/storage/logos-api-admin/069cfc80-7502-11ee-8a21-f7cc79dd73f5-xs.png
- amex.svg: https://http2.mlstatic.com/storage/logos-api-admin/b4785730-c13f-11ee-b4b3-bb9a23b70639-xl.svg
- pix.gif: https://www.mercadopago.com/org-img/MP3/API/logos/pix.gif
- boleto.gif: https://www.mercadopago.com/org-img/MP3/API/logos/bolbradesco.gif

Disponibilidade de uma marca não garante aprovação de uma transação ou
parcelamento específico. As condições finais aparecem no checkout.

## Acabamento de 05/11/2026

As miniaturas pequenas de Elo, Mastercard, Pix e boleto deixaram de ser usadas no rodapé. Originais anteriores preservados para histórico, sem deformação nem ampliação artificial.

- `elo-oficial.png` (328×168): arte monocromática positiva publicada em https://www.elo.com.br/marca-elo/ — https://media.elo.com.br/strapi-hml/monochromatic_brand_white_mobile_298b21a40c.png . A própria marca recomenda a variante positiva em canais de aceitação.
- `pix-oficial.png` (540×190): original Banco Central — https://www.bcb.gov.br/content/estabilidadefinanceira/piximg/logo_pix.png . Arte preservada integralmente, também usada no checkout.
- `master-oficial.svg`: símbolo vetorial do titular — https://www.mastercard.com/etc.clientlibs/marts/clientlibs/clientlib-site/resources/icons/mastercard-favicon.svg . Cores e proporções originais preservadas.
- Visa mantém o original Mercado Pago de 64×48 sem ampliação acima desse tamanho; American Express mantém o SVG original.
- Boleto é representado pelo ícone vetorial genérico Barcode do lucide-react já instalado, com legenda Boleto. Não usar marca de banco para sugerir beneficiário diferente.

Legendas identificam as marcas por extenso; imagens decorativas não repetem a leitura acessível. As marcas indicam opções ilustradas, não aprovação garantida ou elegibilidade de todo cartão/débito.
