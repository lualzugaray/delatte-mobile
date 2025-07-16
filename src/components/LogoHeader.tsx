import React from "react";
import { View, Image } from "react-native";
import { useTailwind } from "tailwind-rn";
import logo from "../assets/logo.png";

export const LogoHeader = () => {
  const tw = useTailwind();
  return (
    <View style={tw("items-center my-6")}>
      <Image source={logo} style={tw("w-32 h-32")} resizeMode="contain" />
    </View>
  );
};
