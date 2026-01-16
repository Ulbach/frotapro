/** @OnlyCurrentDoc
 * Frota Pro - Backend (Google Apps Script)
 * Compatível com sua planilha atual (colunas lidas por NOME DE CABEÇALHO)
 * JSONP no GET e POST via <iframe> com callback parent.salvoCallback
 */

// ===== CONFIG =====
const SPREADSHEET_ID = '1InNx25rQ6_5bxqcFK95neE0lF20w-rIHtpyH2QD4vJs'; // ajuste se necessário
const DEFAULT_TZ = 'America/Sao_Paulo';

function norm_(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+|_+/g,''); }
function getHeaderMap_(sh){ const lastCol=sh.getLastColumn(); const headers=sh.getRange(1,1,1,lastCol).getValues()[0]; const m={}; headers.forEach((h,i)=>m[norm_(h)]=i); return m; }
function colIdx_(m,names){ for (var i=0;i<names.length;i++){ const k=norm_(names[i]); if(k in m) return m[k]; } return -1; }
function readCell_(row,idx){ return idx>=0 ? row[idx] : ''; }
function getTZ_(){ return Session.getScriptTimeZone() || DEFAULT_TZ; }

function doGet(e){
  try{
    const action=(e&&e.parameter&&e.parameter.action||'').toLowerCase();
    if(action==='getlistas'){
      const listas=getListas_();
      return ContentService.createTextOutput("listaCallback("+JSON.stringify(listas)+");").setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    if(action==='gethistorico'){
      const hist=getHistorico_();
      return ContentService.createTextOutput("historicoCallback("+JSON.stringify(hist)+");").setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput("historicoCallback([]);").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }catch(err){
    return ContentService.createTextOutput("historicoCallback([]);").setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}

function doPost(e){
  let ok=false;
  try{
    let body='';
    if(e&&e.parameter&&typeof e.parameter.postData==='string') body=e.parameter.postData; else if(e&&e.postData&&typeof e.postData.contents==='string') body=e.postData.contents;
    if(!body) throw new Error('Payload ausente');
    if(/^postData=/.test(body)) body=body.replace(/^postData=/,'');
    if(/%7B|%22/i.test(body)) { try{ body=decodeURIComponent(body);}catch(_){}}
    const p=JSON.parse(body);
    ok=salvarRegistro_(p);
  }catch(err){ ok=false; }

  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>'+
    '<script>try{parent.salvoCallback({ok:'+(ok?'true':'false')+'});}catch(e){}</script>'+
    '</body></html>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getHistorico_(){
  const sh=getOrCreateSheet_('Historico');
  const last=sh.getLastRow(); if(last<2) return [];
  const map=getHeaderMap_(sh);
  const rVeiculo=colIdx_(map,['veiculo']);
  const rMotorista=colIdx_(map,['motorista']);
  const rSeguranca=colIdx_(map,['seguranca']);
  const rStatus=colIdx_(map,['status']);
  const rDestino=colIdx_(map,['destino']);
  const rKmSaida=colIdx_(map,['kmsaida','km_saida']);
  const rKmRetorno=colIdx_(map,['kmretorno','km_retorno']);
  const rKmRodado=colIdx_(map,['kmrodado','km_rodado']);
  const rDataSaida=colIdx_(map,['datasaida','dadossaida']);
  const rDataRetorno=colIdx_(map,['dataretorno']);

  const values=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();
  const out=[];
  for(var i=0;i<values.length;i++){
    const row=values[i];
    const veiculo=String(readCell_(row,rVeiculo)||'');
    const motorista=String(readCell_(row,rMotorista)||'');
    const seguranca=String(readCell_(row,rSeguranca)||'');
    const status=String(readCell_(row,rStatus)||'');
    const destino=String(readCell_(row,rDestino)||'---');
    const kmSaida=Number(readCell_(row,rKmSaida)||0);
    const kmRetorno=Number(readCell_(row,rKmRetorno)||0);
    const kmRodado=Number(readCell_(row,rKmRodado)||0);
    const dataSaida=readCell_(row,rDataSaida)||'';
    const dataRetorno=readCell_(row,rDataRetorno)||'';
    out.push({veiculo,motorista,seguranca,status,destino,kmSaida,kmRetorno,kmRodado,dataSaida,dataRetorno,
      kmsaida:kmSaida, kmretorno:kmRetorno, datasaida:dataSaida, dataretorno:dataRetorno});
  }
  return out;
}

function salvarRegistro_(p){
  if(!p||!p.veiculo||!p.motorista||!p.seguranca||!p.status) return false;
  const sh=getOrCreateSheet_('Historico');
  const map=getHeaderMap_(sh);
  const lastCol=sh.getLastColumn();

  const iVeiculo=colIdx_(map,['veiculo']);
  const iMotorista=colIdx_(map,['motorista']);
  const iSeguranca=colIdx_(map,['seguranca']);
  const iDestino=colIdx_(map,['destino']);
  const iStatus=colIdx_(map,['status']);
  const iKmSaida=colIdx_(map,['kmsaida','km_saida']);
  const iKmRetorno=colIdx_(map,['kmretorno','km_retorno']);
  const iKmRodado=colIdx_(map,['kmrodado','km_rodado']);
  const iDataSaida=colIdx_(map,['datasaida','dadossaida']);
  const iDataRetorno=colIdx_(map,['dataretorno']);

  const row=new Array(Math.max(lastCol,10)).fill('');
  const now=new Date();
  const dataFmt=Utilities.formatDate(now,getTZ_(),'dd/MM HH:mm');

  if(iVeiculo>=0) row[iVeiculo]=String(p.veiculo);
  if(iMotorista>=0) row[iMotorista]=String(p.motorista);
  if(iSeguranca>=0) row[iSeguranca]=String(p.seguranca);
  if(iDestino>=0) row[iDestino]=String(p.destino||'---');
  if(iStatus>=0) row[iStatus]=String(p.status);

  if(p.status==='FORA'){
    if(iKmSaida>=0) row[iKmSaida]=Number(p.kmSaida||0);
    if(iDataSaida>=0) row[iDataSaida]=dataFmt;
  } else {
    if(iKmRetorno>=0) row[iKmRetorno]=Number(p.kmRetorno||0);
    if(iKmRodado>=0) row[iKmRodado]=Number(p.kmRodado||0);
    if(iDataRetorno>=0) row[iDataRetorno]=dataFmt;
  }

  sh.appendRow(row);
  return true;
}

function getListas_(){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh=ss.getSheetByName('Listas');
  if(!sh) return {veiculos:[],motoristas:[],segurancas:[]};
  const last=sh.getLastRow(); if(last<2) return {veiculos:[],motoristas:[],segurancas:[]};
  const rng=sh.getRange(2,1,last-1,3).getValues();
  const v=[], m=[], s=[]; for(var i=0;i<rng.length;i++){ const a=String(rng[i][0]||'').trim(); const b=String(rng[i][1]||'').trim(); const c=String(rng[i][2]||'').trim(); if(a) v.push(a); if(b) m.push(b); if(c) s.push(c); }
  return { veiculos:[...new Set(v)], motoristas:[...new Set(m)], segurancas:[...new Set(s)] };
}

function getOrCreateSheet_(name){ const ss=SpreadsheetApp.openById(SPREADSHEET_ID); let sh=ss.getSheetByName(name); if(!sh) sh=ss.insertSheet(name); return sh; }
