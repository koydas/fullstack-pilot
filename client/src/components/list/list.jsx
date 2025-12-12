import {
  AppDate,
  AppItem,
  AppMeta,
  AppName,
  ListContainer,
  RemoveButton,
} from './list.styles';

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function List({ apps, onRemove, showEmpty = true }) {
  return (
    <ListContainer aria-live="polite">
      {apps.length === 0 && showEmpty && <p>No apps yet.</p>}

      {apps.map((app) => (
        <AppItem key={app._id}>
          <AppMeta>
            <AppName>{app.name}</AppName>
            <AppDate>Created {formatDate(app.createdAt)}</AppDate>
          </AppMeta>
          <RemoveButton type="button" onClick={() => onRemove(app)}>
            Remove app
          </RemoveButton>
        </AppItem>
      ))}
    </ListContainer>
  );
}
