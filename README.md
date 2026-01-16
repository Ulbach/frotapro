# Frota Pro — HOTFIX JSONP + compat com sua planilha

**O que inclui:**
- `index.html`: hotfix do JSONP (callbacks globais + fila + timeout), correções de kmAnterior/kmRodado e datas; loader sempre sai (allSettled).
- `Code.gs`: Apps Script lendo **por nome de cabeçalho** e gravando compatível com `dadosSaida`.

## Como publicar
1. **Apps Script**
   - Abra seu projeto → substitua `Code.gs` por este → Implante nova versão do **Aplicativo da web**.
   - Executar como: **Você** | Acesso: **Qualquer pessoa com o link**.
   - Copie a URL que termina com **/exec**.
2. **GitHub Pages**
   - Substitua `index.html` no repositório.
   - Abra o site → engrenagem → cole a URL **/exec** → Salvar.

## Testes
- GET: `.../exec?action=getlistas&_ts=123` → `listaCallback(...)`
- GET: `.../exec?action=gethistorico&_ts=123` → `historicoCallback(...)`
- POST: confirme um registro e veja a resposta com `<script>parent.salvoCallback({ok:true})</script>`.
