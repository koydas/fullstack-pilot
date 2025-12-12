import styled from 'styled-components';

const StyledPrimaryButton = styled.button`
  background: #22c55e;
  color: white;
  border: none;
  padding: 0.75rem 1.1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default StyledPrimaryButton;
