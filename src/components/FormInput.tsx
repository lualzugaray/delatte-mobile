import React from "react";
import {
  TextInput,
  Text,
  View,
  TextInputProps
} from "react-native";
import { useTailwind } from "tailwind-rn";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export const FormInput: React.FC<Props> = ({
  label,
  error,
  style,
  ...rest
}) => {
  const tw = useTailwind();
  return (
    <View style={tw("mb-4")}>
      {label && (
        <Text style={tw("text-base font-bold text-primary mb-1")}>
          {label}
        </Text>
      )}
      <TextInput
        style={[tw("border border-gray-300 rounded-full px-4 py-2"), style]}
        placeholderTextColor="#999"
        {...rest}
      />
      {error && <Text style={tw("text-red-500 mt-1")}>{error}</Text>}
    </View>
  );
};
