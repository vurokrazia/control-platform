import React from 'react';
import JSONPretty from 'react-json-pretty';
import 'react-json-pretty/themes/monikai.css';

/**
 * JSON formatting utilities for payload display
 */
export const jsonFormatter = {
  /**
   * Format payload string as JSON or plain text
   */
  formatPayload(payload: string): React.ReactElement {
    try {
      const parsed = JSON.parse(payload);
      return <JSONPretty data={parsed} theme="monikai" />;
    } catch {
      return <span className="font-monospace">{payload}</span>;
    }
  }
};