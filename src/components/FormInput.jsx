const FormInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  required,
  options,
  textarea,
  error,
  className = "",
  ...props
}) => {
  const id = `field-${name}`;

  return (
    <label className={`block ${className}`} htmlFor={id}>
      <span className="field-label">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      {options ? (
        <select id={id} name={name} value={value ?? ""} onChange={onChange} required={required} className="input-shell mt-1" {...props}>
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option.value ?? option} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea id={id} name={name} value={value ?? ""} onChange={onChange} required={required} className="input-shell mt-1 min-h-24 resize-y" {...props} />
      ) : (
        <input id={id} name={name} type={type} value={value ?? ""} onChange={onChange} required={required} className="input-shell mt-1" {...props} />
      )}
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
};

export default FormInput;
