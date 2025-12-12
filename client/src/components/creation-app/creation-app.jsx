import PrimaryButton from '../buttons/PrimaryButton/PrimaryButton.jsx';
import { FormRow, StatusText, TextInput } from './creation-app.styles.js';

export default function CreationApp({ name, onNameChange, onSubmit, loading, error }) {
  return (
    <>
      <FormRow onSubmit={onSubmit}>
        <TextInput
          type="text"
          name="appName"
          placeholder="Enter an app name"
          value={name}
          onChange={onNameChange}
          disabled={loading}
          aria-label="App name"
        />
        <PrimaryButton type="submit" disabled={loading || !name.trim()}>
          Add app
        </PrimaryButton>
      </FormRow>
      {error && <StatusText>{error}</StatusText>}
    </>
  );
}
