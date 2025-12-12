import { Header, Logo, Subtitle, Title } from './header.styles';

export default function AppHeader() {
  return (
    <Header>
      <Logo aria-hidden="true" />
      <div>
        <Subtitle>FullStack Pilot</Subtitle>
        <Title>App Manager</Title>
      </div>
    </Header>
  );
}
