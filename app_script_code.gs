
/**
 * VERSÃO 20.0 - GESTÃO DE FROTA (REGISTRO COMPLETO DE DATA/HORA NO RETORNO)
 */

function doGet(e) {
  const params = e.parameter || {};
  const action = (params.action || '').toLowerCase();
  
  try {
    let ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("Vínculo inexistente");

    const getListas = () => {
      let sh = ss.getSheetByName('Listagem');
      if (!sh) {
        sh = ss.insertSheet('Listagem');
        sh.getRange(1,1,1,3).setValues([['Veículos','Motoristas','Seguranças']]);
        sh.appendRow(['VEÍCULO 01','MOTORISTA 01','PORTARIA 01']);
      }
      const data = sh.getDataRange().getValues();
      const res = { veiculos: [], motoristas: [], segurancas: [] };
      if (data.length > 1) {
        for (let i = 1; i < data.length; i++) {
          if (data[i][0]) res.veiculos.push(String(data[i][0]));
          if (data[i][1]) res.motoristas.push(String(data[i][1]));
          if (data[i][2]) res.segurancas.push(String(data[i][2]));
        }
      }
      return res;
    };

    if (action === 'init') {
      if (!ss.getSheetByName('App_Controle')) {
        const logSh = ss.insertSheet('App_Controle');
        logSh.appendRow(['veiculo', 'motorista', 'seguranca', 'kmSaida', 'destino', 'dataSaida', 'status', 'kmRetorno', 'kmRodado', 'dataRetorno']);
      }
      return createJsonResponse({ success: true, data: getListas() });
    }

    if (action === 'getlistas') {
      return createJsonResponse(getListas());
    }

    if (action === 'gethistorico') {
      const sh = ss.getSheetByName('App_Controle');
      if (!sh) return createJsonResponse([]);
      const data = sh.getDataRange().getValues();
      if (data.length <= 1) return createJsonResponse([]);
      const headers = ['veiculo', 'motorista', 'seguranca', 'kmsaida', 'destino', 'datasaida', 'status', 'kmretorno', 'kmrodado', 'dataretorno'];
      const rows = data.slice(1).map(r => {
        let obj = {};
        headers.forEach((h, i) => {
          let v = r[i];
          obj[h] = v instanceof Date ? v.toISOString() : v;
        });
        return obj;
      });
      return createJsonResponse(rows);
    }

    if (action === 'clearhistorico') {
      const sh = ss.getSheetByName('App_Controle');
      if (sh && sh.getLastRow() > 1) {
        sh.deleteRows(2, sh.getLastRow() - 1);
      }
      return createJsonResponse({ success: true });
    }

    return createJsonResponse({ success: false, error: "Ação não reconhecida." });

  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName('App_Controle') || ss.insertSheet('App_Controle');
    const now = new Date();

    if (payload.status === 'DISPONÍVEL') {
      const data = sh.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][0]) === String(payload.veiculo) && data[i][6] === 'FORA') {
          sh.getRange(i + 1, 2).setValue(payload.motorista); 
          sh.getRange(i + 1, 3).setValue(payload.seguranca); 
          sh.getRange(i + 1, 7).setValue('DISPONÍVEL');
          sh.getRange(i + 1, 8).setValue(payload.kmRetorno);
          sh.getRange(i + 1, 9).setValue(payload.kmRodado);
          
          // Grava a data/hora e força o formato na célula (Coluna J)
          const cellRetorno = sh.getRange(i + 1, 10);
          cellRetorno.setValue(now);
          cellRetorno.setNumberFormat("dd/MM/yyyy HH:mm:ss");
          
          return ContentService.createTextOutput("OK");
        }
      }
    } else {
      // Registrar Nova Saída
      sh.appendRow([payload.veiculo, payload.motorista, payload.seguranca, payload.kmSaida, payload.destino, now, 'FORA']);
      // Força formato de data/hora na Saída também (Coluna F)
      sh.getRange(sh.getLastRow(), 6).setNumberFormat("dd/MM/yyyy HH:mm:ss");
    }
    return ContentService.createTextOutput("OK");
  } catch (err) {
    return ContentService.createTextOutput("Erro: " + err.toString());
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
