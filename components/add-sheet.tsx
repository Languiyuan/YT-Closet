import { Modal, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useState, useEffect } from 'react';
 

export function AddSheet({
  visible,
  onClose,
  onPicked,
  
}: {
  visible: boolean;
  onClose: () => void;
  onPicked: (type: 'item' | 'outfit', uri: string) => void;
  
}) {
  const [step, setStep] = useState<'type' | 'source'>('type');
  const [selectedType, setSelectedType] = useState<'item' | 'outfit'>('item');
  

  // Reset step when modal opens
  useEffect(() => {
    if (visible) {
        setStep('type');
    }
  }, [visible]);

  const chooseLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert('需要相册权限以选择图片');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      onPicked(selectedType, res.assets[0].uri);
      onClose();
    }
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      alert('需要相机权限以拍摄图片');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      onPicked(selectedType, res.assets[0].uri);
      onClose();
    }
  };

  const handleTypeSelect = (type: 'item' | 'outfit') => {
      setSelectedType(type);
      setStep('source');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {step === 'source' && (
                    <Pressable onPress={() => setStep('type')} style={{ padding: 4 }}>
                        <IconSymbol name="chevron.left" size={24} color="#333" />
                    </Pressable>
                )}
                <ThemedText type="subtitle" style={{ fontSize: 18 }}>{step === 'type' ? '选择类型' : '选择图片'}</ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeIcon}>
              <IconSymbol name="xmark.circle.fill" size={28} color="#E0E0E0" />
            </Pressable>
          </View>
          
          <View style={styles.content}>
            {step === 'type' ? (
                <>
                  <Pressable style={styles.button} onPress={() => handleTypeSelect('item')}>
                      <ThemedText style={styles.buttonText}>单品</ThemedText>
                      <IconSymbol name="tshirt" size={20} color="#FFF" style={{ opacity: 0.8 }} />
                  </Pressable>
                  <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => handleTypeSelect('outfit')}>
                      <ThemedText style={styles.secondaryButtonText}>搭配</ThemedText>
                      <IconSymbol name="person.2.fill" size={20} color={Colors.light.tint} style={{ opacity: 0.8 }} />
                  </Pressable>
                </>
            ) : (
                <>
                  <Pressable style={styles.button} onPress={chooseLibrary}>
                      <ThemedText style={styles.buttonText}>从相册选择</ThemedText>
                  </Pressable>
                  <Pressable style={[styles.button, styles.secondaryButton]} onPress={takePhoto}>
                      <ThemedText style={styles.secondaryButtonText}>拍照</ThemedText>
                  </Pressable>
                </>
            )}
          </View>
        </Pressable>
      </Pressable>
      
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { 
      backgroundColor: '#FFF', 
      padding: 24, 
      borderTopLeftRadius: 24, 
      borderTopRightRadius: 24, 
      gap: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeIcon: { padding: 4 },
  content: { gap: 12 },
  button: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
      backgroundColor: '#FFF',
      borderWidth: 1,
      borderColor: Colors.light.tint,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  secondaryButtonText: { color: Colors.light.tint, fontSize: 16, fontWeight: '600' },
});
