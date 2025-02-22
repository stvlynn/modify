import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import KnowledgeBaseScreen from '../components/knowledgebase/KnowledgeBaseScreen';

const Stack = createStackNavigator();

const KnowledgeNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="KnowledgeBase" 
        component={KnowledgeBaseScreen}
        options={{ headerShown: false }}
      />
      {/* 后续可以添加更多知识库相关的页面 */}
      {/* 
      <Stack.Screen
        name="KnowledgeDetail"
        component={KnowledgeDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateKnowledge"
        component={CreateKnowledgeScreen}
        options={{ headerShown: false }}
      />
      */}
    </Stack.Navigator>
  );
};

export default KnowledgeNavigator;
