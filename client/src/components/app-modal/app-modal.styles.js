import styled from 'styled-components';

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  position: relative;
  background: white;
  width: 100%;
  height: 100%;
  max-width: 1200px;
  max-height: 100vh;
  border-radius: 0;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (min-width: 960px) {
    border-radius: 18px;
    margin: 1rem;
  }
`;

export const ModalHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

export const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.4rem;
`;

export const CloseButton = styled.button`
  border: none;
  background: transparent;
  font-size: 1.8rem;
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;
  color: #0f172a;
`;

export const Tabs = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const TabList = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1.5rem 0.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

export const TabButton = styled.button`
  padding: 0.65rem 1rem;
  border-radius: 12px 12px 0 0;
  border: none;
  background: ${(props) => (props.$active ? '#e0f2fe' : 'transparent')};
  color: #0f172a;
  font-weight: 700;
  cursor: pointer;
  border-bottom: ${(props) => (props.$active ? '2px solid #0ea5e9' : '2px solid transparent')};
`;

export const TabPanels = styled.div`
  padding: 1rem 1.5rem;
  flex: 1;
  overflow: auto;
  background: #f8fafc;
`;

export const TabPanel = styled.section`
  height: 100%;
`;

export const TabContent = styled.div`
  background: white;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  box-shadow: inset 0 1px 0 #e2e8f0;
  line-height: 1.6;
`;
