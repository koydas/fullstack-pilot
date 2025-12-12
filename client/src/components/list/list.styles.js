import styled from 'styled-components';

export const ListContainer = styled.div`
  display: grid;
  gap: 0.75rem;
`;

export const AppItem = styled.article`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
`;

export const AppMeta = styled.div`
  display: flex;
  flex-direction: column;
`;

export const AppName = styled.span`
  font-weight: 700;
`;

export const AppDate = styled.span`
  font-size: 0.85rem;
  color: #475569;
`;

export const RemoveButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
`;
