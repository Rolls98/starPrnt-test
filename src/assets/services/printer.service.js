import {StarPRNT} from 'react-native-star-prnt';

const getEmulation = modelName => {
  if (modelName.match(/TSP100/gi)) {
    return 'StarGraphic';
  } else if (modelName.match(/TSP700II|TSP650II|TSP800II|FVP10/gi)) {
    return 'StarLine';
  } else if (
    modelName.match(/SM-S210i|SM-S220i|SM-S230i|SM-T300i\/T300|SM-T400i/gi)
  ) {
    return 'EscPosMobile';
  } else if (modelName.match(/SM-L200|SM-L300|StarPRNT|mPOP/gi)) {
    return 'StarPRNT';
  }

  return 'StarLine';
};

export class PrinterService {
  constructor() {
    this.port = '';
    this.emulation = '';
  }

  connect(printer) {
    this.port = printer.portName;
    this.emulation = getEmulation(printer.modelName);
    return new Promise((resolve, reject) => {
      StarPRNT.connect(this.port, this.emulation, false)
        .then(r => {
          console.log('imprimante connecté', r);
          resolve(r);
        })
        .catch(err => reject(err));
    });
  }

  findAllPrinters(type) {
    return new Promise((resolve, reject) => {
      StarPRNT.portDiscovery(type)
        .then(res => resolve(res))
        .catch(err => reject(err));
    });
  }

  printerTicket() {
    return new Promise((resolve, reject) => {
      let commands = [];
      commands.push({
        append:
          '  TEST IMPRIMANTE \n' +
          '123 Star Road\n' +
          'City, State 12345\n' +
          '\n',
      });
      commands.push({
        appendCutPaper: StarPRNT.CutPaperAction.PartialCutWithFeed,
      });

      StarPRNT.print(this.emulation, commands)
        .then(r => {
          console.log('Impression ok', r);
          resolve(r);
        })
        .catch(err => {
          console.log("Erreur d'impression", err);
          reject(err);
        });
    });
  }

  disconnect() {
    StarPRNT.disconnect();
  }
}
