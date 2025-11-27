// components/SearchablePicker.tsx
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// In your SearchablePicker component interface
interface SearchablePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  items: Array<{ label: string; value: string; flag?: string; subtitle?: string }>;
  title: string;
  placeholder: string;
  selectedValue: string | string[]; // Update to support both single and array
  multiSelect?: boolean; // Add this prop
}
export default function SearchablePicker({
  visible,
  onClose,
  onSelect,
  items,
  title,
  placeholder = 'Search...',
  selectedValue,
}: SearchablePickerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={placeholder}
            placeholderTextColor="#7B8799"
            autoFocus
          />
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => `${item.value}-${index}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.item,
                selectedValue === item.value && styles.selectedItem,
              ]}
              onPress={() => handleSelect(item.value)}
            >
              <View style={styles.itemContent}>
                {item.flag && <Text style={styles.flag}>{item.flag}</Text>}
                <View style={styles.itemTextContainer}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  {item.subtitle && (
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  )}
                </View>
              </View>
              {selectedValue === item.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: '#070A12',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#7B8799',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  searchInput: {
    backgroundColor: '#F7F8FB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#070A12',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F8FB',
  },
  selectedItem: {
    backgroundColor: '#F8F1DA',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#070A12',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
  },
  checkmark: {
    fontSize: 20,
    color: '#F2CC66',
    marginLeft: 12,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#7B8799',
  },
});