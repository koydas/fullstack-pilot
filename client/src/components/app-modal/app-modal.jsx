import { useMemo, useState } from 'react';
import {
  CloseButton,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalTitle,
  TabButton,
  TabContent,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from './app-modal.styles';

const TABS = [
  { id: 'details', label: 'App details' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'services', label: 'Services' },
  { id: 'models', label: 'Models' },
];

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function AppModal({ app, onClose }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const appPanels = useMemo(
    () => ({
      details: (
        <div>
          <p><strong>Name:</strong> {app.name}</p>
          <p><strong>Created:</strong> {formatDate(app.createdAt)}</p>
          <p>
            <strong>Description:</strong> Manage your app settings, dependencies, services, and models
            from one place.
          </p>
        </div>
      ),
      dependencies: (
        <ul>
          <li>React 18.0+</li>
          <li>Axios client</li>
          <li>Styled Components</li>
        </ul>
      ),
      services: (
        <ul>
          <li>API Gateway &mdash; Healthy</li>
          <li>Authentication &mdash; Running</li>
          <li>Database &mdash; Connected</li>
        </ul>
      ),
      models: (
        <ul>
          <li>User model</li>
          <li>Session model</li>
          <li>Audit log model</li>
        </ul>
      ),
    }),
    [app.createdAt, app.name]
  );

  return (
    <ModalBackdrop onClick={onClose} role="presentation">
      <ModalContent onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <ModalHeader>
          <ModalTitle>{app.name}</ModalTitle>
          <CloseButton type="button" aria-label="Close" onClick={onClose}>
            ×
          </CloseButton>
        </ModalHeader>

        <Tabs>
          <TabList role="tablist" aria-label="App details">
            {TABS.map((tab) => (
              <TabButton
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                $active={activeTab === tab.id}
              >
                {tab.label}
              </TabButton>
            ))}
          </TabList>

          <TabPanels>
            {TABS.map((tab) => (
              <TabPanel
                key={tab.id}
                role="tabpanel"
                hidden={activeTab !== tab.id}
                aria-hidden={activeTab !== tab.id}
              >
                {activeTab === tab.id && <TabContent>{appPanels[tab.id]}</TabContent>}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </ModalContent>
    </ModalBackdrop>
  );
}
