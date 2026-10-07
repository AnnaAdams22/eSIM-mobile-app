/**
 * Design system preview — DEV ONLY.
 *
 * Renders every colour, type style, logo variant and UI component so the design
 * system can be checked on a real device in Expo Go. Redirects to Home in
 * production builds, so it is not reachable there.
 */

import { useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { Plus } from 'lucide-react-native';

import {
  Badge,
  Button,
  Card,
  ChipGroup,
  Divider,
  EmptyState,
  ErrorState,
  Header,
  ListRow,
  Logo,
  Screen,
  SearchBar,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import { lightColors, useTheme, type ColorName, type TextVariant } from '@/theme';

const COLOR_NAMES = Object.keys(lightColors) as ColorName[];
const TYPE_VARIANTS: TextVariant[] = [
  'display',
  'h1',
  'h2',
  'h3',
  'body',
  'bodySmall',
  'caption',
  'button',
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md, marginBottom: theme.spacing.xxl }}>
      <Text variant="h2">{title}</Text>
      {children}
    </View>
  );
}

export default function DesignPreviewScreen() {
  const theme = useTheme();
  const [chip, setChip] = useState('all');
  const [segment, setSegment] = useState('active');
  const [search, setSearch] = useState('');

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen>
      <Header title="Design system" />

      {/* Logo variants */}
      <Section title="Logo">
        <Card style={{ gap: theme.spacing.lg, alignItems: 'flex-start' }}>
          <Logo variant="full" size={36} />
          <Logo variant="symbol" size={44} />
          <Logo variant="wordmark" size={18} />
          <Text variant="caption" color="textSecondary">
            Temporary assets — black, never recoloured.
          </Text>
        </Card>
      </Section>

      {/* Wordmark type style */}
      <Section title="Wordmark style">
        <Card>
          <Text style={theme.typography.wordmark}>
            <Text style={[theme.typography.wordmark, { fontFamily: theme.fontFamily.bold }]}>ESIM </Text>
            <Text style={[theme.typography.wordmark, { fontFamily: theme.fontFamily.light }]}>GLOBAL</Text>
          </Text>
        </Card>
      </Section>

      {/* Colors */}
      <Section title="Colours">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
          {COLOR_NAMES.map((name) => (
            <View key={name} style={{ width: 96, gap: theme.spacing.xs }}>
              <View
                style={{
                  height: 56,
                  borderRadius: theme.radii.sm,
                  backgroundColor: lightColors[name],
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              />
              <Text variant="caption">{name}</Text>
              <Text variant="caption" color="textSecondary">
                {lightColors[name]}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <Card style={{ gap: theme.spacing.md }}>
          {TYPE_VARIANTS.map((v) => (
            <Text key={v} variant={v}>
              {v} — The quick brown fox
            </Text>
          ))}
        </Card>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <View style={{ gap: theme.spacing.md }}>
          <Button label="Primary" onPress={() => {}} />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
          <Button label="With icon" icon={<Plus size={18} color={theme.colors.onPrimary} />} onPress={() => {}} />
          <Button label="Loading" loading onPress={() => {}} />
          <Button label="Disabled" disabled onPress={() => {}} />
        </View>
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Badge label="Active" tone="success" />
          <Badge label="-50% OFF" tone="discount" />
          <Badge label="Neutral" tone="neutral" />
        </View>
      </Section>

      {/* Chips */}
      <Section title="Chips">
        <ChipGroup
          value={chip}
          onChange={setChip}
          options={[
            { value: 'all', label: 'All' },
            { value: 'europe', label: 'Europe' },
            { value: 'asia', label: 'Asia' },
            { value: 'americas', label: 'Americas' },
          ]}
        />
      </Section>

      {/* Segmented control */}
      <Section title="Segmented control">
        <SegmentedControl
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'past', label: 'Past' },
          ]}
        />
      </Section>

      {/* Search bar */}
      <Section title="Search bar">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search destination or country" />
      </Section>

      {/* List rows */}
      <Section title="List rows">
        <Card padding="sm">
          <ListRow
            title="France"
            subtitle="From €4.90"
            leading={<Flag />}
            onPress={() => {}}
          />
          <Divider inset={48} />
          <ListRow
            title="Japan"
            subtitle="From €6.90"
            leading={<Flag />}
            value="€6.90"
            onPress={() => {}}
          />
        </Card>
      </Section>

      {/* Skeletons */}
      <Section title="Skeletons">
        <Card style={{ gap: theme.spacing.sm }}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="80%" height={14} />
        </Card>
      </Section>

      {/* Empty + error states */}
      <Section title="Empty state">
        <Card style={{ height: 240 }}>
          <EmptyState title="No eSIMs yet" body="Buy your first data plan and it'll appear here." actionLabel="Browse destinations" onAction={() => {}} />
        </Card>
      </Section>

      <Section title="Error state">
        <Card style={{ height: 240 }}>
          <ErrorState onRetry={() => {}} />
        </Card>
      </Section>
    </Screen>
  );
}

/** A tiny round placeholder standing in for a country flag. */
function Flag() {
  const theme = useTheme();
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: theme.radii.pill,
        backgroundColor: theme.colors.surfaceMuted,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    />
  );
}
