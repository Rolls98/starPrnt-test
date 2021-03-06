import React, {useRef, useEffect, useState} from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {PrinterService} from '../../assets/services/printer.service';
import ViewShot from 'react-native-view-shot';

import SunmiInnerPrinter from 'react-native-sunmi-inner-printer';
import EscPosPrinter, {
  getPrinterSeriesByName,
} from 'react-native-esc-pos-printer';
import {RNUSBPrinter} from 'react-native-usb-printer';

//import ImgToBase64 from 'react-native-image-base64';

const printerService = new PrinterService();
const types = [
  {label: 'Tous', value: 'All'},
  {label: 'Wifi', value: 'LAN'},
  {label: 'Bluetooth', value: 'Bluetooth'},
  {label: 'USB', value: 'USB'},
];

const Radio = ({checked, margin = {}, onPress = () => {}}) => {
  return (
    <Pressable
      style={{
        height: 24,
        width: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'orange',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: margin.mr,
        marginLeft: margin.ml,
        marginTop: margin.mt,
        marginBottom: margin.mb,
      }}
      onPress={onPress}>
      {checked ? (
        <View
          style={{
            height: 12,
            width: 12,
            borderRadius: 6,
            backgroundColor: 'orange',
          }}
        />
      ) : null}
    </Pressable>
  );
};

const Printer = ({printer, checked, onSelectPrinter}) => (
  <Pressable style={styles.flexRow} onPress={() => onSelectPrinter(printer)}>
    <Text>
      {printer.modelName || printer.name || printer.device_name || 'UNKNOWN'}
    </Text>
    <Radio
      checked={checked}
      margin={{ml: 10}}
      onPress={() => onSelectPrinter(printer)}
    />
  </Pressable>
);

const index = () => {
  //printers LISTS
  const [printers, setPrinters] = useState([]);
  const [escPrinters, setEscPrinters] = useState([]);
  const [printersUsb, setPrintersUsb] = useState([]);

  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printType, setPrintType] = useState('Bluetooth');
  const [printSystem, setPrintSystem] = useState('Sumni');

  const [state, setState] = useState('');
  const [message, setMessage] = useState('');

  const [image, setImage] = useState('');
  const [hidden, setHidden] = useState(false);

  const viewRef = useRef(null);
  const onSumniPrint = async () => {
    setMessage('');
    try {
      setState('Impression en cours');
      await SunmiInnerPrinter.setFontSize(40);
      await SunmiInnerPrinter.printOriginalText('Sumni Impression Test\n');
      await SunmiInnerPrinter.printOriginalText(
        'Merci SENSEI, TU ES LE MEILLEUR\n',
      );
      setState('Termin??');
    } catch (err) {
      setState('');
      setMessage('Une erreur est survenue: ' + err.message);
    }
  };

  const [printerSelected, setPrinterSelected] = useState(null);
  const [oldPrinter, setOldPrinter] = useState(null);

  const handleFindPrinters = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (printSystem === 'escPos') {
        setState('Recherche en cours...');
        EscPosPrinter.discover({})
          .then(printers => {
            setState(`${printers.length} imprimante(s) trouv??e(s)`);
            setEscPrinters(printers);
            setLoading(false);
          })
          .catch(e => {
            console.log('Print error:', e.message);
            setMessage('Une erreur est survenue: ' + e.message);
            setState('');
            setLoading(false);
          });
      } else if (printSystem === 'OnelineUsb') {
        let devices = await RNUSBPrinter.getUSBDeviceList();
        setState(`${devices.length} imprimante(s) par usb trouv??e(s)`);
        setPrintersUsb(devices);
        setLoading(false);
      } else {
        printerService
          .findAllPrinters(printType)
          .then(res => {
            setPrinters(res);
            setLoading(false);
          })
          .catch(err => {
            setMessage('Une erreur est survenue: ' + err.message);
            setState('');
            setLoading(false);
          });
      }
    } catch (err) {
      console.log('err ', err.message);
      setLoading(false);
      setState('');
      setMessage('Une erreur est survenue: ' + err.message);
    }
  };

  const onPrintUsb = async () => {
    const {vendor_id, product_id} = printerSelected;
    const printer = await RNUSBPrinter.connectPrinter(vendor_id, product_id);
    setState('Imprimante connect??');
    await RNUSBPrinter.printText(`<M>Qte</M><C>Produits</C>         <C>Tarif</C>\n`);
    await RNUSBPrinter.printText(`<M>1</M><C>Coca</C>      <C>1 EUR</C>\n`);
    await RNUSBPrinter.printText(`<M>3</M><C>Coca</C>      <C>3 EUR</C>\n`);
    await RNUSBPrinter.printText(
      `<M>3</M><C>Composition:Menu-GRAND</C>      <C>3 EUR</C>\n`,
    );
    await RNUSBPrinter.printText(`<M>1</M><C>Coca</C>      <C>1 EUR</C>\n`);
    await RNUSBPrinter.printText(`<M>3</M><C>Coca</C>      <C>3 EUR</C>\n`);
    await RNUSBPrinter.printText(
      `<M>3</M><C>Composition:Menu-GRAND</C>      <C>3 EUR</C>\n`,
    );
    setState('Impression termin??e');
  };

  const onPrint = () => {
    setPrinting(true);

    printerService
      .connect(printerSelected)
      .then(async r => {
        setState('imprimante connect??');

        printerService
          .printerTicket(image)
          .then(r => {
            setState('impression r??ussi ' + r);
            setPrinting(false);
          })
          .catch(err => {
            setMessage('Une erreur est survenue: ' + err.message);
            setPrinting(false);
          });
      })
      .catch(err => {
        setMessage('Une erreur est survenue: ' + err.message);
        setState('');
        setPrinting(false);
      });
  };

  const onEscPrint = async () => {
    setLoading(true);

    try {
      const {target, name} = printerSelected;
      if (target !== oldPrinter?.target) {
        await EscPosPrinter.init({
          target: target,
          seriesName: getPrinterSeriesByName(name),
        });
        setState('imprimante connect??');
        setOldPrinter(printerSelected);
      }

      const printing = new EscPosPrinter.printing();
      const status = await printing
        .initialize()
        .text('test printer')
        .imageAsset(image, 200)
        .cut()
        .send()
        .then(() => setState('imprimante termin??'))
        .catch(e => setMessage('Une erreur est survenue: ' + e.message));
      setState('impression termin??e => ' + status);
    } catch (err) {
      setMessage('Une erreur est survenue: ' + err.message);
    }
  };

  const onSelectPrinter = printer => {
    setPrinterSelected(printer);
  };

  useEffect(() => {
    if (viewRef?.current) viewRef?.current.capture();
  }, []);

  useEffect(() => {
    EscPosPrinter.addPrinterStatusListener(status => {
      setState('current printer status: ' + status);
    });
  }, []);

  return (
    <View style={{alignItems: 'center', padding: 10}}>
      <View style={{width: '80%', zIndex: 10}}>
        <Text style={{marginBottom: 10, marginTop: 10}}>
          Choisissez un syst??me :{' '}
        </Text>
        <View style={styles.flexRow}>
          {['StarPrnt', 'Sumni', 'escPos', 'OnelineUsb'].map((system, id) => {
            return (
              <View key={id} style={styles.flexRow}>
                <Radio
                  checked={printSystem === system}
                  value={system}
                  onPress={() => setPrintSystem(system)}
                  margin={{mr: 10}}
                />
                <Text>{system}</Text>
              </View>
            );
          })}
        </View>
        {['StarPrnt', 'escPos', 'OnelineUsb'].includes(printSystem) && (
          <>
            {['StarPrnt', 'escPos'].includes(printSystem) && (
              <>
                <Text style={{marginBottom: 10}}>
                  Chercher une imprimante par :{' '}
                </Text>
                <View style={styles.flexRow}>
                  {types.map((type, id) => {
                    return (
                      <View key={id} style={styles.flexRow}>
                        <Radio
                          checked={printType === type.value}
                          value={type.value}
                          onPress={() => setPrintType(type.value)}
                          margin={{mr: 10}}
                        />
                        <Text>{type.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <View style={[styles.flexRow, {justifyContent: 'center'}]}>
              <TouchableOpacity onPress={handleFindPrinters} style={styles.btn}>
                <Text style={{color: 'white'}}>
                  {loading ? 'Chargement...' : 'Rechercher'}
                </Text>
              </TouchableOpacity>
            </View>
            {(printSystem === 'escPos'
              ? escPrinters
              : printSystem === 'OnelineUsb'
              ? printersUsb
              : printers
            ).map((printer, id) => {
              return (
                <Printer
                  printer={printer}
                  key={id}
                  checked={
                    (printSystem === 'StarPrnt' &&
                      printerSelected?.modelName === printer.modelName) ||
                    (printSystem === 'escPos' &&
                      printerSelected.target === printer.target) ||
                    (printSystem === 'OnelineUsb' &&
                      printerSelected?.device_id === printer.device_id)
                  }
                  onSelectPrinter={onSelectPrinter}
                  name="printer"
                />
              );
            })}
          </>
        )}

        {(printerSelected || printSystem === 'Sumni') && (
          <View style={[styles.flexRow, {justifyContent: 'center'}]}>
            <TouchableOpacity
              onPress={
                printSystem === 'Sumni'
                  ? onSumniPrint
                  : printSystem === 'escPos'
                  ? onEscPrint
                  : printSystem === 'OnelineUsb'
                  ? onPrintUsb
                  : onPrint
              }
              style={styles.btn}>
              <Text style={{color: 'white'}}>
                {printing ? 'Chargement...' : "Faire un test  d'impression"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View>
          <Text>Informations:</Text>
          <Text>Etat: {state}</Text>
          <Text>
            Message d'erreur: <Text style={{color: 'red'}}>{message}</Text>
          </Text>
        </View>
      </View>
      <ViewShot
        ref={viewRef}
        options={{format: 'png', quality: 0.9}}
        onCapture={uri => {
          setImage(uri);
          setHidden(true);
        }}
        style={{display: hidden ? 'none' : 'flex'}}>
        <View class="title">
          <Text style={{textAlign: 'center'}}>PlanetApp</Text>
        </View>
        <View class="title">
          <Text>Super !!</Text>
        </View>
        <View class="title">
          <Text>Super Top!!</Text>
        </View>
        <View class="title">
          <Text>Bravo SENSEI !!</Text>
        </View>
        <View class="title">
          <Text>Bravo MEHDI !!</Text>
        </View>
        <View class="sub_title">
          <Text>Super Top!!</Text>
        </View>
        <View class="title">
          <Text style={{color: 'black', fontWeight: '500', fontSize: 25}}>
            Allahmdoulilah, Allah akbar!!
          </Text>
        </View>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    marginVertical: 30,
    backgroundColor: '#000',
    width: '50%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  hide: {
    display: 'none',
  },
});

export default index;