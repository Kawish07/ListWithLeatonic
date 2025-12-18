// Dev-only overflow logger to help catch accidental global overflow changes
export function enableOverflowLogger() {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'production') return;

  try {
    const props = ['overflow', 'overflow-x', 'overflow-y', 'overflowX', 'overflowY'];
    const origSetProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function(prop, value, priority) {
      try {
        if (props.includes(prop)) {
          // eslint-disable-next-line no-console
          console.warn('[overflow-logger] setProperty', prop, value, '\n', new Error().stack.split('\n').slice(2,6).join('\n'));
        }
      } catch (e) {}
      return origSetProperty.call(this, prop, value, priority);
    };

    const origRemoveProperty = CSSStyleDeclaration.prototype.removeProperty;
    CSSStyleDeclaration.prototype.removeProperty = function(prop) {
      try {
        if (props.includes(prop)) {
          // eslint-disable-next-line no-console
          console.warn('[overflow-logger] removeProperty', prop, '\n', new Error().stack.split('\n').slice(2,6).join('\n'));
        }
      } catch (e) {}
      return origRemoveProperty.call(this, prop);
    };
  } catch (e) {
    // ignore in environments that don't support DOM prototypes
  }
}

export default enableOverflowLogger;
