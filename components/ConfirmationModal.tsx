import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from './Themed';
import { UserItem } from '@/constants/ImportTypes';
import Colors from '@/constants/Colors';
import { useLoading } from '@/contexts/loading';
import Spinner from 'react-native-loading-spinner-overlay';

const ConfirmationModal = ({ visible, onClose, onConfirm, isAll, selectedItems }: {
    visible: boolean, onClose: () => void, onConfirm: () => void, isAll: boolean, selectedItems: UserItem[]
}) => {
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
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{alertHeaderText}</Text>
          <Text style={styles.modalText}>{alertText}</Text>
          
          <View style={styles.buttonRow}>
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
    backgroundColor: 'transparent',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 1,
    shadowOpacity: 1,
    shadowColor: 'gray'
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
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'gray'
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'white'
  },
  confirmButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'red'
  },
  confirmButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'white'
  },
});