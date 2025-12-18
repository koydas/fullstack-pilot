import {
  CloseButton,
  DangerButton,
  ModalActions,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalTitle,
  SecondaryButton,
} from './app-modal.styles.js';

export default function DeleteAppModal({ app, onCancel, onConfirm, loading }) {
  return (
    <ModalBackdrop onClick={onCancel} role="presentation">
      <ModalContent
        $size="compact"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Delete "${app.name}"?`}
      >
        <ModalHeader>
          <ModalTitle>Delete "{app.name}"?</ModalTitle>
          <CloseButton type="button" aria-label="Close" onClick={onCancel}>
            ×
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <p>
            This action will permanently delete <strong>{app.name}</strong> and cannot be undone. Any
            associated resources will be removed.
          </p>
          <p>Are you sure you want to continue?</p>
        </ModalBody>

        <ModalActions>
          <SecondaryButton type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </SecondaryButton>
          <DangerButton type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete app'}
          </DangerButton>
        </ModalActions>
      </ModalContent>
    </ModalBackdrop>
  );
}
