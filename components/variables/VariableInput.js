import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const VariableInput = ({ 
  variables = [], 
  savedInputs = {}, 
  onInputsChange,
  onStartChat,
  canEdit = true,
}) => {
  const [inputs, setInputs] = useState({});
  const [selectedVariable, setSelectedVariable] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (savedInputs && Object.keys(savedInputs).length > 0) {
      setInputs(savedInputs);
    } else {
      const initialInputs = {};
      variables.forEach(item => {
        initialInputs[item.key] = item.type === 'select' && item.options?.length 
          ? item.options[0].value 
          : '';
      });
      setInputs(initialInputs);
    }
  }, [savedInputs, variables]);

  const handleInputChange = (key, value) => {
    const newInputs = {
      ...inputs,
      [key]: value,
    };
    setInputs(newInputs);
    onInputsChange?.(newInputs);
  };

  const handleStartChat = () => {
    onStartChat?.(inputs);
  };

  const renderSelectInput = (variable) => {
    const selectedOption = variable.options.find(opt => opt.value === inputs[variable.key]);
    
    return (
      <View>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => {
            if (canEdit) {
              setSelectedVariable(variable);
              setShowOptions(true);
            }
          }}
          disabled={!canEdit}
        >
          <Text style={styles.selectButtonText}>
            {selectedOption?.label || 'Select an option'}
          </Text>
          <Icon name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>

        <Modal
          visible={showOptions && selectedVariable?.key === variable.key}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{variable.name}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowOptions(false);
                    setSelectedVariable(null);
                  }}
                >
                  <Icon name="close" size={24} color="#1F2937" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsList}>
                {variable.options.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.optionItem,
                      inputs[variable.key] === option.value && styles.optionItemSelected
                    ]}
                    onPress={() => {
                      handleInputChange(variable.key, option.value);
                      setShowOptions(false);
                      setSelectedVariable(null);
                    }}
                  >
                    <Text 
                      style={[
                        styles.optionText,
                        inputs[variable.key] === option.value && styles.optionTextSelected
                      ]}
                    >
                      {option.label}
                    </Text>
                    {inputs[variable.key] === option.value && (
                      <Icon name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  const renderInput = (variable) => {
    if (variable.type === 'select') {
      return renderSelectInput(variable);
    }

    return (
      <TextInput
        style={styles.input}
        value={inputs[variable.key]}
        onChangeText={(value) => handleInputChange(variable.key, value)}
        placeholder={`Enter ${variable.name}`}
        editable={canEdit}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {variables.map((variable) => (
          <View key={variable.key} style={styles.inputContainer}>
            <Text style={styles.label}>{variable.name}</Text>
            {renderInput(variable)}
          </View>
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.startButton}
        onPress={handleStartChat}
      >
        <Text style={styles.startButtonText}>Start Chat</Text>
        <Icon name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  selectButtonText: {
    fontSize: 15,
    color: '#1F2937',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  optionsList: {
    padding: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  optionItemSelected: {
    backgroundColor: '#2563EB',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    marginTop: 24,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default VariableInput;
