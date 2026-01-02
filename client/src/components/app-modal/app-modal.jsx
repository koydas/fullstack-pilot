import { useEffect, useState } from 'react';
import PrimaryButton from '../buttons/PrimaryButton/PrimaryButton.jsx';
import {
  CloseButton,
  DangerButton,
  InlineAlert,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalTitle,
  SecondaryButton,
  ServiceActions,
  ServiceDescription,
  ServiceField,
  ServiceForm,
  ServiceInput,
  ServiceIntro,
  ServiceList,
  ServiceMeta,
  ServiceName,
  ServicesLayout,
  ServiceSectionTitle,
  ServiceStatus,
  ServiceTextarea,
  ServiceToolbar,
  ServiceToolbarActions,
  ServiceToolbarText,
  ServiceWrapper,
  TabButton,
  TabContent,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from './app-modal.styles';
import {
  createService,
  deleteService,
  fetchServices,
} from '../../services/services/services-service.jsx';
import {
  createDependancy,
  deleteDependancy,
  fetchDependancies,
} from '../../services/dependancies/dependancies-service.jsx';

const TABS = [
  { id: 'details', label: 'App details' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'services', label: 'Services' },
  { id: 'models', label: 'Models' },
];

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function getErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.description ||
    error?.message ||
    fallbackMessage
  );
}

export default function AppModal({ app, onClose }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [dependancies, setDependancies] = useState([]);
  const [isLoadingDependancies, setIsLoadingDependancies] = useState(false);
  const [dependanciesError, setDependanciesError] = useState('');
  const [dependancyName, setDependancyName] = useState('');
  const [dependancyDescription, setDependancyDescription] = useState('');
  const [isCreatingDependancy, setIsCreatingDependancy] = useState(false);
  const [deletingDependancyId, setDeletingDependancyId] = useState(null);
  const [hasLoadedDependancies, setHasLoadedDependancies] = useState(false);
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [hasLoadedServices, setHasLoadedServices] = useState(false);

  useEffect(() => {
    setDependancies([]);
    setHasLoadedDependancies(false);
    setDependanciesError('');
    setDependancyName('');
    setDependancyDescription('');
    setServices([]);
    setHasLoadedServices(false);
    setServicesError('');
    setServiceName('');
    setServiceDescription('');
  }, [app._id]);

  useEffect(() => {
    if (activeTab === 'dependencies' && !hasLoadedDependancies) {
      loadDependancies();
    }
  }, [activeTab, hasLoadedDependancies, app._id]);

  useEffect(() => {
    if (activeTab === 'services' && !hasLoadedServices) {
      loadServices();
    }
  }, [activeTab, hasLoadedServices, app._id]);

  function normalizeDependancy(item) {
    return {
      id: item.id ?? item.Id,
      name: item.name ?? item.Name,
      description: item.description ?? item.Description,
      createdAt: item.createdAt ?? item.CreatedAt,
    };
  }

  async function loadDependancies() {
    try {
      setIsLoadingDependancies(true);
      setDependanciesError('');
      const data = await fetchDependancies();
      setDependancies(data.map(normalizeDependancy));
    } catch (error) {
      setDependanciesError(getErrorMessage(error, 'Could not load dependencies'));
    } finally {
      setIsLoadingDependancies(false);
      setHasLoadedDependancies(true);
    }
  }

  async function handleCreateDependancy(event) {
    event.preventDefault();
    if (!dependancyName.trim()) return;

    try {
      setIsCreatingDependancy(true);
      const payload = {
        name: dependancyName.trim(),
        description: dependancyDescription.trim(),
      };
      const newDependancy = await createDependancy(payload);
      setDependancies((previous) => [normalizeDependancy(newDependancy), ...previous]);
      setDependancyName('');
      setDependancyDescription('');
      setDependanciesError('');
    } catch (error) {
      setDependanciesError(getErrorMessage(error, 'Could not create dependency'));
    } finally {
      setIsCreatingDependancy(false);
    }
  }

  async function handleDeleteDependancy(id) {
    try {
      setDeletingDependancyId(id);
      await deleteDependancy(id);
      setDependancies((previous) => previous.filter((dependancy) => dependancy.id !== id));
      setDependanciesError('');
    } catch (error) {
      setDependanciesError(getErrorMessage(error, 'Could not remove dependency'));
    } finally {
      setDeletingDependancyId(null);
    }
  }

  async function loadServices() {
    try {
      setIsLoadingServices(true);
      setServicesError('');
      const data = await fetchServices(app._id);
      setServices(data);
    } catch (error) {
      setServicesError(getErrorMessage(error, 'Could not load services'));
    } finally {
      setIsLoadingServices(false);
      setHasLoadedServices(true);
    }
  }

  async function handleCreateService(event) {
    event.preventDefault();
    if (!serviceName.trim()) return;

    try {
      setIsCreatingService(true);
      const payload = {
        name: serviceName.trim(),
        description: serviceDescription.trim(),
      };
      const newService = await createService(payload, app._id);
      setServices((previous) => [newService, ...previous]);
      setServiceName('');
      setServiceDescription('');
      setServicesError('');
    } catch (error) {
      setServicesError(getErrorMessage(error, 'Could not create service'));
    } finally {
      setIsCreatingService(false);
    }
  }

  async function handleDeleteService(id) {
    try {
      setDeletingServiceId(id);
      await deleteService(id, app._id);
      setServices((previous) => previous.filter((service) => service.id !== id));
      setServicesError('');
    } catch (error) {
      setServicesError(getErrorMessage(error, 'Could not remove service'));
    } finally {
      setDeletingServiceId(null);
    }
  }

  function renderDependenciesPanel() {
    return (
      <ServicesLayout>
        <ServiceSectionTitle>Dependencies</ServiceSectionTitle>
        <ServiceIntro>
          Track the dependencies that support <strong>{app.name}</strong>. Add new items or clean up
          ones you no longer need.
        </ServiceIntro>

        <ServiceToolbar>
          <ServiceToolbarText>
            {isLoadingDependancies
              ? 'Loading dependencies...'
              : `You have ${dependancies.length} dependenc${dependancies.length === 1 ? 'y' : 'ies'} configured.`}
          </ServiceToolbarText>
          <ServiceToolbarActions>
            <SecondaryButton
              type="button"
              onClick={loadDependancies}
              disabled={isLoadingDependancies}
            >
              Refresh list
            </SecondaryButton>
          </ServiceToolbarActions>
        </ServiceToolbar>

        <ServiceForm onSubmit={handleCreateDependancy}>
          <ServiceField>
            <span>Dependency name</span>
            <ServiceInput
              value={dependancyName}
              onChange={(event) => setDependancyName(event.target.value)}
              placeholder="e.g. Axios"
              aria-label="Dependency name"
              disabled={isCreatingDependancy}
              required
            />
          </ServiceField>
          <ServiceField>
            <span>Description (optional)</span>
            <ServiceTextarea
              value={dependancyDescription}
              onChange={(event) => setDependancyDescription(event.target.value)}
              placeholder="What does this dependency provide?"
              aria-label="Dependency description"
              disabled={isCreatingDependancy}
              rows={2}
            />
          </ServiceField>
          <PrimaryButton type="submit" disabled={isCreatingDependancy || !dependancyName.trim()}>
            {isCreatingDependancy ? 'Adding...' : 'Add dependency'}
          </PrimaryButton>
        </ServiceForm>

        <ServiceWrapper>
          {dependanciesError && <InlineAlert role="alert">{dependanciesError}</InlineAlert>}

          {isLoadingDependancies ? (
            <ServiceStatus role="status">Loading dependencies from the API...</ServiceStatus>
          ) : dependancies.length === 0 ? (
            <ServiceList role="status">
              <ServiceStatus>No dependencies found for this app yet.</ServiceStatus>
            </ServiceList>
          ) : (
            <ServiceList aria-live="polite">
              {dependancies.map((dependancy) => (
                <ServiceMeta key={dependancy.id}>
                  <ServiceName>{dependancy.name}</ServiceName>
                  <ServiceDescription>
                    {dependancy.description?.trim()
                      ? dependancy.description
                      : 'No description provided.'}
                  </ServiceDescription>
                  <ServiceActions>
                    <DangerButton
                      type="button"
                      onClick={() => handleDeleteDependancy(dependancy.id)}
                      disabled={deletingDependancyId === dependancy.id}
                      aria-label={`Remove ${dependancy.name} dependency`}
                    >
                      {deletingDependancyId === dependancy.id ? 'Removing...' : 'Remove'}
                    </DangerButton>
                  </ServiceActions>
                </ServiceMeta>
              ))}
            </ServiceList>
          )}
        </ServiceWrapper>
      </ServicesLayout>
    );
  }

  function renderServicesPanel() {
    return (
      <ServicesLayout>
        <ServiceSectionTitle>Services</ServiceSectionTitle>
        <ServiceIntro>
          Connect and maintain the services that power <strong>{app.name}</strong>. Create new services,
          refresh their status, or remove ones you no longer need.
        </ServiceIntro>

        <ServiceToolbar>
          <ServiceToolbarText>
            {isLoadingServices
              ? 'Loading services...'
              : `You have ${services.length} configured service${services.length === 1 ? '' : 's'}.`}
          </ServiceToolbarText>
          <ServiceToolbarActions>
            <SecondaryButton type="button" onClick={loadServices} disabled={isLoadingServices}>
              Refresh list
            </SecondaryButton>
          </ServiceToolbarActions>
        </ServiceToolbar>

        <ServiceForm onSubmit={handleCreateService}>
          <ServiceField>
            <span>Service name</span>
            <ServiceInput
              value={serviceName}
              onChange={(event) => setServiceName(event.target.value)}
              placeholder="e.g. Authentication"
              aria-label="Service name"
              disabled={isCreatingService}
              required
            />
          </ServiceField>
          <ServiceField>
            <span>Description (optional)</span>
            <ServiceTextarea
              value={serviceDescription}
              onChange={(event) => setServiceDescription(event.target.value)}
              placeholder="What does this service do?"
              aria-label="Service description"
              disabled={isCreatingService}
              rows={2}
            />
          </ServiceField>
          <PrimaryButton type="submit" disabled={isCreatingService || !serviceName.trim()}>
            {isCreatingService ? 'Adding...' : 'Add service'}
          </PrimaryButton>
        </ServiceForm>

        <ServiceWrapper>
          {servicesError && <InlineAlert role="alert">{servicesError}</InlineAlert>}

          {isLoadingServices ? (
            <ServiceStatus role="status">Loading services from the API...</ServiceStatus>
          ) : services.length === 0 ? (
            <ServiceList role="status">
              <ServiceStatus>No services found for this app yet.</ServiceStatus>
            </ServiceList>
          ) : (
            <ServiceList aria-live="polite">
              {services.map((service) => (
                <ServiceMeta key={service.id}>
                  <ServiceName>{service.name}</ServiceName>
                  <ServiceDescription>
                    {service.description?.trim() ? service.description : 'No description provided.'}
                  </ServiceDescription>
                  <ServiceActions>
                    <DangerButton
                      type="button"
                      onClick={() => handleDeleteService(service.id)}
                      disabled={deletingServiceId === service.id}
                      aria-label={`Remove ${service.name} service`}
                    >
                      {deletingServiceId === service.id ? 'Removing...' : 'Remove'}
                    </DangerButton>
                  </ServiceActions>
                </ServiceMeta>
              ))}
            </ServiceList>
          )}
        </ServiceWrapper>
      </ServicesLayout>
    );
  }

  const appPanels = {
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
    dependencies: renderDependenciesPanel(),
    services: renderServicesPanel(),
    models: (
      <ul>
        <li>User model</li>
        <li>Session model</li>
        <li>Audit log model</li>
      </ul>
    ),
  };

  return (
    <ModalBackdrop onClick={onClose} role="presentation">
      <ModalContent
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
      >
        <ModalHeader>
          <ModalTitle id="app-dialog-title">{app.name}</ModalTitle>
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
                data-active={activeTab === tab.id}
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
