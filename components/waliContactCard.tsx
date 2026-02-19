// components/WaliContactCard.tsx
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface WaliContact {
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  preferred_contact?: string;
}

interface WaliContactCardProps {
  sisterUsername: string;
  waliContact: WaliContact;
}

export default function WaliContactCard({ sisterUsername, waliContact }: WaliContactCardProps) {
  const handleCallWali = () => {
    if (waliContact.phone) {
      Linking.openURL(`tel:${waliContact.phone}`);
    }
  };

  const handleEmailWali = () => {
    if (waliContact.email) {
      const subject = encodeURIComponent(`Marriage Proposal for ${sisterUsername}`);
      const body = encodeURIComponent(
        `Assalamu Alaikum ${waliContact.name},\n\n` +
        `I am contacting you regarding a marriage proposal for ${sisterUsername} through the Mithaq matrimonial platform.\n\n` +
        `I would like to discuss this matter further at your convenience.\n\n` +
        `JazakAllahu Khairan`
      );
      Linking.openURL(`mailto:${waliContact.email}?subject=${subject}&body=${body}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>👤</Text>
        <Text style={styles.headerTitle}>Contact Wali to Proceed</Text>
      </View>

      {/* Wali Information */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Wali Name:</Text>
          <Text style={styles.value}>{waliContact.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Relationship:</Text>
          <Text style={styles.value}>{waliContact.relationship}</Text>
        </View>

        {waliContact.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{waliContact.phone}</Text>
          </View>
        )}

        {waliContact.email && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{waliContact.email}</Text>
          </View>
        )}

        {waliContact.preferred_contact && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Preferred:</Text>
            <Text style={[styles.value, styles.preferred]}>
              {waliContact.preferred_contact}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {waliContact.phone && (
          <TouchableOpacity 
            style={styles.callButton}
            onPress={handleCallWali}
          >
            <Text style={styles.callButtonText}>📱 Call Wali</Text>
          </TouchableOpacity>
        )}

        {waliContact.email && (
          <TouchableOpacity 
            style={styles.emailButton}
            onPress={handleEmailWali}
          >
            <Text style={styles.emailButtonText}>✉️  Email Wali</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Islamic Reminder */}
      <View style={styles.reminder}>
        <Text style={styles.reminderText}>
          ☪️  Remember: All communication should be conducted with Islamic etiquette and respect for the Wali's role.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#F2CC66',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: '#070A12',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#7B8799',
  },
  value: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#070A12',
    flex: 1,
    textAlign: 'right',
  },
  preferred: {
    color: '#17803A',
    fontFamily: 'Inter_600SemiBold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#17803A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  emailButton: {
    flex: 1,
    backgroundColor: '#070A12',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emailButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#F2CC66',
  },
  reminder: {
    backgroundColor: '#F7F8FB',
    borderRadius: 6,
    padding: 12,
  },
  reminderText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#7B8799',
    lineHeight: 18,
    textAlign: 'center',
  },
});