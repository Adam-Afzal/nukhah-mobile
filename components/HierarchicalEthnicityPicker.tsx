// components/HierarchicalEthnicityPicker.tsx
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ETHNICITIES, Ethnicity } from '@/lib/locationData';

interface HierarchicalEthnicityPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  title: string;
  selectedValue: string | string[];
  multiSelect?: boolean;
}

export default function HierarchicalEthnicityPicker({
  visible,
  onClose,
  onSelect,
  title,
  selectedValue,
  multiSelect = false,
}: HierarchicalEthnicityPickerProps) {
  const [level, setLevel] = useState<'parent' | 'children'>('parent');
  const [activeParent, setActiveParent] = useState<Ethnicity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isSelected = (value: string) => {
    if (Array.isArray(selectedValue)) return selectedValue.includes(value);
    return selectedValue === value;
  };

  const handleClose = () => {
    setLevel('parent');
    setActiveParent(null);
    setSearchQuery('');
    onClose();
  };

  const handleBack = () => {
    setLevel('parent');
    setActiveParent(null);
    setSearchQuery('');
  };

  const handleParentPress = (ethnicity: Ethnicity) => {
    if (ethnicity.subEthnicities && ethnicity.subEthnicities.length > 0) {
      setActiveParent(ethnicity);
      setLevel('children');
      setSearchQuery('');
    } else {
      onSelect(ethnicity.name);
      if (!multiSelect) {
        handleClose();
      }
    }
  };

  const handleSubPress = (sub: string) => {
    const value = `${activeParent!.name} - ${sub}`;
    onSelect(value);
    if (!multiSelect) {
      handleClose();
    }
  };

  const handleAnyParentPress = () => {
    onSelect(activeParent!.name);
    if (!multiSelect) {
      handleClose();
    }
  };

  // Filter for parent-level search
  const filteredParents = ETHNICITIES.filter(eth => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    if (eth.name.toLowerCase().includes(q)) return true;
    if (eth.description?.toLowerCase().includes(q)) return true;
    if (eth.subEthnicities?.some(s => s.toLowerCase().includes(q))) return true;
    return false;
  });

  // Filter for children-level search
  const filteredSubs = activeParent?.subEthnicities?.filter(s =>
    !searchQuery || s.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const renderParentItem = ({ item }: { item: Ethnicity }) => {
    const hasChildren = item.subEthnicities && item.subEthnicities.length > 0;
    // A parent is "selected" if selectedValue equals it exactly, or any selected value starts with "name - "
    const parentSelected = Array.isArray(selectedValue)
      ? selectedValue.some(v => v === item.name || v.startsWith(`${item.name} - `))
      : selectedValue === item.name || (selectedValue as string).startsWith(`${item.name} - `);

    return (
      <TouchableOpacity
        style={[styles.item, parentSelected && styles.selectedItem]}
        onPress={() => handleParentPress(item)}
      >
        <View style={styles.itemContent}>
          <Text style={styles.flag}>{item.flag}</Text>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemLabel}>{item.name}</Text>
            {item.description && (
              <Text style={styles.itemSubtitle}>{item.description}</Text>
            )}
          </View>
        </View>
        <View style={styles.itemRight}>
          {parentSelected && !hasChildren && (
            <Text style={styles.checkmark}>✓</Text>
          )}
          {hasChildren && (
            <Text style={styles.chevron}>›</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSubItem = ({ item: sub }: { item: string }) => {
    const value = `${activeParent!.name} - ${sub}`;
    const selected = isSelected(value);
    return (
      <TouchableOpacity
        style={[styles.item, selected && styles.selectedItem]}
        onPress={() => handleSubPress(sub)}
      >
        <View style={styles.itemContent}>
          <Text style={styles.flag}>{activeParent!.flag}</Text>
          <Text style={styles.itemLabel}>{sub}</Text>
        </View>
        {selected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={level === 'children' ? handleBack : handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          {level === 'children' ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹ Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
          <Text style={styles.title}>
            {level === 'children' ? activeParent!.name : title}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={level === 'children' ? `Search ${activeParent?.name} backgrounds...` : 'Search ethnicity...'}
            placeholderTextColor="#7B8799"
            autoFocus={false}
          />
        </View>

        {/* List */}
        {level === 'parent' ? (
          <FlatList
            data={filteredParents}
            keyExtractor={(item) => item.name}
            renderItem={renderParentItem}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={filteredSubs}
            keyExtractor={(item) => item}
            ListHeaderComponent={
              <TouchableOpacity
                style={[styles.item, styles.anyItem, isSelected(activeParent!.name) && styles.selectedItem]}
                onPress={handleAnyParentPress}
              >
                <View style={styles.itemContent}>
                  <Text style={styles.flag}>{activeParent!.flag}</Text>
                  <View style={styles.itemTextContainer}>
                    <Text style={[styles.itemLabel, styles.anyLabel]}>Any {activeParent!.name}</Text>
                    <Text style={styles.itemSubtitle}>Open to all {activeParent!.name} backgrounds</Text>
                  </View>
                </View>
                {isSelected(activeParent!.name) && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            }
            renderItem={renderSubItem}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
          />
        )}

        {/* Done button for multi-select */}
        {multiSelect && (
          <View style={styles.doneButtonContainer}>
            <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: '#070A12',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 64,
    justifyContent: 'center',
  },
  backButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#F2CC66',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 22,
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
  anyItem: {
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 2,
    borderBottomColor: '#E7EAF0',
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
  anyLabel: {
    color: '#3D4A5C',
  },
  itemSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 20,
    color: '#F2CC66',
    marginLeft: 12,
  },
  chevron: {
    fontSize: 22,
    color: '#7B8799',
    marginLeft: 8,
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
  doneButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E7EAF0',
  },
  doneButton: {
    backgroundColor: '#070A12',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#F2CC66',
  },
});
