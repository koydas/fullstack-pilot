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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-width: 1200px;
  max-height: 100vh;
  border-radius: 0;

  @media (min-width: 960px) {
    border-radius: 18px;
    margin: 1rem;
  }

  ${(props) =>
    props.$size === 'compact'
      ? `
    width: auto;
    height: auto;
    max-width: 520px;
    max-height: 90vh;
    border-radius: 18px;
    margin: 1rem;
  `
      : ''}
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
  background: ${(props) => (props['data-active'] ? '#e0f2fe' : 'transparent')};
  color: #0f172a;
  font-weight: 700;
  cursor: pointer;
  border-bottom: ${(props) =>
    props['data-active'] ? '2px solid #0ea5e9' : '2px solid transparent'};
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

export const ModalBody = styled.div`
  padding: 1.25rem 1.5rem;
  line-height: 1.6;
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
`;

export const SecondaryButton = styled.button`
  background: white;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const DangerButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const ServicesLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const ServiceSectionTitle = styled.h3`
  margin: 0;
  font-size: 1.15rem;
`;

export const ServiceIntro = styled.p`
  margin: 0;
  color: #475569;
`;

export const ServiceToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.75rem 1rem;
`;

export const ServiceToolbarText = styled.p`
  margin: 0;
  color: #0f172a;
  font-weight: 700;
`;

export const ServiceToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const ServiceForm = styled.form`
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  align-items: end;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
`;

export const ServiceField = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-weight: 700;
  color: #0f172a;
`;

export const ServiceInput = styled.input`
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  font-size: 1rem;

  &:focus {
    outline: 2px solid #38bdf8;
    border-color: #38bdf8;
  }

  &:disabled {
    background: #f8fafc;
    color: #94a3b8;
  }
`;

export const ServiceTextarea = styled.textarea`
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  font-size: 1rem;
  min-height: 72px;
  resize: vertical;

  &:focus {
    outline: 2px solid #38bdf8;
    border-color: #38bdf8;
  }

  &:disabled {
    background: #f8fafc;
    color: #94a3b8;
  }
`;

export const ServiceWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const InlineAlert = styled.div`
  background: #fef2f2;
  border: 1px solid #fecdd3;
  color: #991b1b;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-weight: 600;
`;

export const ServiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const ServiceMeta = styled.article`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03);
`;

export const ServiceName = styled.h4`
  margin: 0;
  color: #0f172a;
  font-size: 1.05rem;
`;

export const ServiceDescription = styled.p`
  margin: 0;
  color: #475569;
`;

export const ServiceActions = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const ServiceStatus = styled.p`
  margin: 0;
  color: #475569;
`;
