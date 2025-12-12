import StyledPrimaryButton from './PrimaryButton.styles.js';

export default function PrimaryButton({ children, ...buttonProps }) {
  return <StyledPrimaryButton {...buttonProps}>{children}</StyledPrimaryButton>;
}
