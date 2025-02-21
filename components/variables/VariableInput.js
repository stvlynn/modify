import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

// 启用 LayoutAnimation 在 Android 上的支持
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const VariableInput = ({
  variables,
  savedInputs,
  onInputsChange,
  onStartChat,
}) => {
  const [inputs, setInputs] = useState(savedInputs || {});
  const [expandedSelect, setExpandedSelect] = useState(null);

  useEffect(() => {
    console.log('[VariableInput] Component mounted');
    console.log('[VariableInput] Initial variables:', JSON.stringify(variables, null, 2));
    console.log('[VariableInput] Initial savedInputs:', JSON.stringify(savedInputs, null, 2));
  }, []);

  useEffect(() => {
    if (savedInputs) {
      console.log('[VariableInput] Updating inputs with savedInputs:', JSON.stringify(savedInputs, null, 2));
      setInputs(savedInputs);
    }
  }, [savedInputs]);

  const handleInputChange = (variable, value) => {
    console.log('[VariableInput] Input change:', { variable, value });
    const newInputs = { ...inputs, [variable]: value };
    console.log('[VariableInput] New inputs state:', newInputs);
    setInputs(newInputs);
    onInputsChange?.(newInputs);
  };

  const toggleSelect = (variable) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSelect(expandedSelect === variable ? null : variable);
  };

  const renderLabel = (label, required) => (
    <View style={styles.labelContainer}>
      <Text style={styles.label}>{label}</Text>
      {required && <Text style={styles.required}>*</Text>}
    </View>
  );

  const renderTextInput = (config) => {
    const { label, variable, required = false, placeholder = '', max_length } = config;
    return (
      <View style={styles.inputGroup} key={variable}>
        {renderLabel(label, required)}
        <TextInput
          style={styles.input}
          value={inputs[variable] || ''}
          onChangeText={(text) => handleInputChange(variable, text)}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
          placeholderTextColor="#999"
          maxLength={max_length}
        />
      </View>
    );
  };

  const renderSelectInput = (config) => {
    const { label, variable, required = false, options = [] } = config;
    const selectedValue = inputs[variable] || '';
    const isExpanded = expandedSelect === variable;

    return (
      <View style={styles.inputGroup} key={variable}>
        {renderLabel(label, required)}
        <View style={styles.selectContainer}>
          <TouchableOpacity
            style={[
              styles.selectButton,
              isExpanded && styles.selectButtonExpanded
            ]}
            onPress={() => toggleSelect(variable)}
          >
            <Text style={[
              styles.selectButtonText,
              !selectedValue && styles.placeholder
            ]}>
              {selectedValue || `Select ${label.toLowerCase()}`}
            </Text>
            <Text style={[
              styles.selectArrow,
              isExpanded && styles.selectArrowExpanded
            ]}>
              ▼
            </Text>
          </TouchableOpacity>
          {isExpanded && (
            <View style={styles.optionsContainer}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionItem,
                    selectedValue === option && styles.optionItemSelected,
                    index === options.length - 1 && styles.optionItemLast
                  ]}
                  onPress={() => {
                    handleInputChange(variable, option);
                    toggleSelect(variable);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    selectedValue === option && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {variables.map((variable) => {
            console.log('[VariableInput] Rendering variable:', JSON.stringify(variable, null, 2));
            if (variable['text-input']) {
              return renderTextInput(variable['text-input']);
            }
            if (variable['select']) {
              return renderSelectInput(variable['select']);
            }
            return null;
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            console.log('[VariableInput] Start chat pressed with inputs:', JSON.stringify(inputs, null, 2));
            onStartChat(inputs);
          }}
        >
          <Text style={styles.buttonText}>Start Chat</Text>
          <Text style={styles.buttonIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  required: {
    color: '#EF4444',
    marginLeft: 4,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fff',
  },
  selectContainer: {
    position: 'relative',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  selectArrow: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  selectArrowExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  placeholder: {
    color: '#999',
  },
  optionsContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionItemSelected: {
    backgroundColor: '#f3f4f6',
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  optionTextSelected: {
    color: '#2563EB',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    color: '#fff',
    fontSize: 20,
  },
});

export default VariableInput;
