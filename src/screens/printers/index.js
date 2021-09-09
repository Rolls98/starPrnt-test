import React, {useState} from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {PrinterService} from '../../assets/services/printer.service';

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
    <Text>{printer.modelName}</Text>
    <Radio
      checked={checked}
      margin={{ml: 10}}
      onPress={() => onSelectPrinter(printer)}
    />
  </Pressable>
);

const index = () => {
  const [printers, setPrinters] = useState([]);

  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printType, setPrintType] = useState('Bluetooth');

  const [printerSelected, setPrinterSelected] = useState(null);

  const handleFindPrinters = () => {
    setLoading(true);
    printerService
      .findAllPrinters(printType)
      .then(res => {
        setPrinters(res);
        setLoading(false);
        console.log(res);
      })
      .catch(err => {
        console.log('err', err);
        setLoading(false);
      });
  };

  const onPrint = () => {
    setPrinting(true);
    printerService
      .connect(printerSelected)
      .then(r => {
        console.log('imprimante connecté', r);
        printerService
          .printerTicket()
          .then(r => {
            console.log('impression reussi', r);
            setPrinting(false);
          })
          .catch(err => {
            console.log("Une erreur s'est produite.", err);
            setPrinting(false);
          });
      })
      .catch(err => {
        console.log("Une erreur s'est produite", err);
        setPrinting(false);
      });
  };

  const onSelectPrinter = printer => {
    setPrinterSelected(printer);
  };

  return (
    <View style={{alignItems: 'center', padding: 10}}>
      <View style={{width: '80%'}}>
        <Text style={{marginBottom: 10}}>Chercher une imprimante par : </Text>

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
        <View style={[styles.flexRow, {justifyContent: 'center'}]}>
          <TouchableOpacity onPress={handleFindPrinters} style={styles.btn}>
            <Text style={{color: 'white'}}>
              {loading ? 'Chargement...' : 'Rechercher'}
            </Text>
          </TouchableOpacity>
        </View>
        {printers.map((printer, id) => {
          return (
            <Printer
              printer={printer}
              key={id}
              checked={printerSelected?.modelName === printer.modelName}
              onSelectPrinter={onSelectPrinter}
              name="printer"
            />
          );
        })}

        {printerSelected && (
          <View style={[styles.flexRow, {justifyContent: 'center'}]}>
            <TouchableOpacity onPress={onPrint} style={styles.btn}>
              <Text style={{color: 'white'}}>
                {printing ? 'Chargement...' : "Faire un test  d'impression"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
});

export default index;
