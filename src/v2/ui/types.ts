export interface SearchPickerOption {
  id: string;
  name: string;
}

export interface SearchPickerProps<T extends SearchPickerOption> {
  options: T[];
  label: string;
  itemLabel: string;
  fieldName: string;
  selectedId: string;
  query: string;
  disabled: boolean;
  describeOption?: (option: T) => string;
  onQueryChange: (query: string) => void;
  onSelect: (option: T) => void;
}
