import React from 'react';
import { useIsMobile } from '../../hooks/use-media-query';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

/**
 * In-page mode switch: dropdown at <=767px (agents-ui-material.mdc), scrollable tabs above it.
 */
export const AgentsModeSelect = ({ label = 'View', value, onChange, options = [] }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="minaki-ui mb-4">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger aria-label={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="minaki-ui mb-4">
      <Tabs value={value} onValueChange={onChange}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {options.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
