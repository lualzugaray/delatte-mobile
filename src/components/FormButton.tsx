import React from "react";
import { TouchableOpacity, Text } from "react-native";
import { useTailwind } from "tailwind-rn";

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const FormButton: React.FC<Props> = ({ title, loading, disabled, onPress }) => {
  const tw = useTailwind();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={tw(
        `bg-primary py-3 rounded-full items-center ${
          disabled ? "opacity-50" : ""
        }`
      )}
    >
      <Text style={tw("text-white font-semibold")}>
        {loading ? "Cargando..." : title}
      </Text>
    </TouchableOpacity>
  );
};
