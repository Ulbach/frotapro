# Frota Pro — Patch compatível com sua planilha atual

Este pacote contém:

- `index.html` — seu layout antigo, **corrigido** (datas camelCase, kmAnterior/kmRodado e loader).
- `Code.gs` — Apps Script que **lê/grava por nome de coluna**, compatível com sua aba `Historico` (com `dadosSaida`).

## Como usar

1) **Apps Script**
   - Abra https://script.google.com/ → seu projeto.
   - Substitua o conteúdo do `Code.gs` pelo deste pacote.
   - Confirme `SPREADSHEET_ID` no topo.
   - **Implantar → Gerenciar implantações → Editar → Salvar nova versão**.
   - Quem tem acesso: **Qualquer pessoa com o link** | Executar como: **Você**.
   - Copie a URL que termina com `/exec`.

2) **Frontend (GitHub Pages)**
   - Substitua o `index.html` no seu repositório (raiz ou `docs/`).
   - Abra o site → engrenagem → cole a URL `/exec` → **Salvar URL**.
   - Clique em **Atualizar** no Dashboard.

## Testes

- GET (JSONP):
  - `.../exec?action=getlistas&_ts=123` → deve responder `listaCallback({...})`.
  - `.../exec?action=gethistorico&_ts=123` → deve responder `historicoCallback([...])`.
- POST (Salvar):
  - Ao confirmar, na aba Network a resposta do POST deve conter:
    `<script>parent.salvoCallback({ok:true})</script>`.

## Observações

- O backend retorna **camelCase** (`kmSaida`, `kmRetorno`, `dataSaida`, `dataRetorno`) e também as chaves minúsculas para compatibilidade.
- O cálculo do **KM ANTERIOR** agora usa o último registro do veículo:
  - Se o último `status` for `FORA` → usa `kmSaida` daquele registro.
  - Se for `DISPONÍVEL` → usa `kmRetorno`.
