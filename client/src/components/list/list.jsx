import {
  AppActions,
  AppDate,
  AppItem,
  AppMeta,
  AppName,
  ListContainer,
  OpenButton,
  RemoveButton,
} from './list.styles';

function formatDate(value) {
  return new Date(value).toLocaleString();
}

export default function List({ apps, onRemove, showEmpty = true, onSelect }) {
  return (
    <ListContainer aria-live="polite">
      {apps.length === 0 && showEmpty && <p>No apps yet.</p>}

      {apps.map((app) => (
        <AppItem key={app._id} aria-label={app.name}>
          <AppMeta>
            <AppName>{app.name}</AppName>
            <AppDate>Created {formatDate(app.createdAt)}</AppDate>
          </AppMeta>
          <AppActions>
            <OpenButton type="button" onClick={() => onSelect?.(app)}>
              Open app
            </OpenButton>
            <RemoveButton
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(app);
              }}
            >
              Remove app
            </RemoveButton>
          </AppActions>
        </AppItem>
      ))}
    </ListContainer>
  );
}
