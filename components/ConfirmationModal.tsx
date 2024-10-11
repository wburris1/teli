import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from './Themed';
import { UserItem } from '@/constants/ImportTypes';
import Colors from '@/constants/Colors';
import { useLoading } from '@/contexts/loading';
import Spinner from 'react-native-loading-spinner-overlay';

const ConfirmationModal = ({ visible, onClose, onConfirm, isAll, selectedItems }: {
    visible: boolean, onClose: () => void, onConfirm: () => void, isAll: boolean, selectedItems: UserItem[]
}) => {
  const colorScheme = useColorScheme();
  const pluralText = selectedItems.length > 1 ? "these items" : "this item";
  const alertText = !isAll ? 
    `Are you sure you want to remove ${pluralText} from the list?` : 
    `Deleting ${pluralText} will remove it from all your lists. Are you sure you want to delete ${pluralText}?`;

  const alertHeaderText = !isAll ? "Confirm Remove" : "Confirm Delete";
  const alertButtonText = !isAll ? "Remove" : "Delete";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, {backgroundColor: Colors[colorScheme ?? 'light'].gray}]}>
          <Text style={styles.modalTitle}>{alertHeaderText}</Text>
          <Text style={styles.modalText}>{alertText}</Text>
          
          <View style={[styles.buttonRow, {backgroundColor: Colors[colorScheme ?? 'light'].gray}]}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={() => {onClose(); onConfirm();}}>
              <Text style={styles.confirmButtonText}>{alertButtonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    paddingTop: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopWidth: 1,
    borderColor: 'gray'
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomLeftRadius: 20,
    borderRightWidth: 0.5,
    borderColor: 'gray'
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomRightRadius: 20,
    borderLeftWidth: 0.5,
    borderColor: 'gray'
  },
  confirmButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'red'
  },
});