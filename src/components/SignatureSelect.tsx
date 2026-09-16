import { SIGNATURE_GROUPS, SIGNATURES_BY_ID, signaturesInGroup } from '../theory/signatures';
import type { Settings } from '../state/settings';
import { Select } from './ui/Select';

interface SignatureSelectProps {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  id?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function SignatureSelect({
  settings,
  update,
  id,
  name,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: SignatureSelectProps) {
  return (
    <Select
      id={id}
      name={name}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      tone="signature"
      className={className}
      value={settings.signatureId ?? ''}
      onChange={(event) => {
        const next = event.target.value;
        if (next === '') {
          update({ signatureId: null });
          return;
        }
        const signature = SIGNATURES_BY_ID[next];
        if (!signature) return;
        update({ signatureId: signature.id, scaleId: signature.scaleId, shapeIndex: null });
      }}
    >
      <option value="">None</option>
      {SIGNATURE_GROUPS.map((group) => (
        <optgroup key={group.id} label={group.label}>
          {signaturesInGroup(group.id).map((signature) => (
            <option key={signature.id} value={signature.id}>
              {signature.name}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}
