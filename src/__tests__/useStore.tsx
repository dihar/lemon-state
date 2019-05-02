import React from 'react';
import { render, fireEvent, getByTestId, act, cleanup } from "react-testing-library";
import App from './TestApp';

beforeEach(() => {
  // @ts-ignore
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb()); // mock async action calling
});

afterEach(() => {
  cleanup();
  // @ts-ignore
  window.requestAnimationFrame.mockRestore();
});

jest.useFakeTimers();

test('App loads with initial state', () => {
  const { container } = render(<App />);

  const loadingSpan = getByTestId(container, 'loading');
  const errorSpan = getByTestId(container, 'error');
  const checkedDiv = getByTestId(container, 'checked');

  expect(loadingSpan.textContent).toBe('');
  expect(errorSpan.textContent).toBe('');
  expect(checkedDiv.textContent).toBe('Not checked');
});

test('Changing data in the store change view', () => {
  const { container } = render(<App />);
  const loadingSpan = getByTestId(container, 'loading');
  const errorSpan = getByTestId(container, 'error');
  const checkedDiv = getByTestId(container, 'checked');
  const listDiv = getByTestId(container, 'list');

  const loadButton = getByTestId(container, 'loadButton');
  const loadErrorButton = getByTestId(container, 'loadErrorButton');
  const checkbox = getByTestId(container, 'checkbox');
  const resetButton = getByTestId(container, 'resetButton');

  act(() => {
    fireEvent.click(loadButton);
  });
  expect(loadingSpan.textContent).toBe('Loading');

  act(() => {
    jest.runOnlyPendingTimers();
  });

  expect(loadingSpan.textContent).toBe('');
  expect(listDiv.children.length).toBe(2);
  expect(errorSpan.textContent).toBe('');
  expect(checkedDiv.textContent).toBe('Not checked');

  act(() => {
    fireEvent.click(loadErrorButton);
  });
  expect(loadingSpan.textContent).toBe('Loading');

  act(() => {
    jest.runOnlyPendingTimers();
  });

  expect(loadingSpan.textContent).toBe('');
  expect(listDiv.children.length).toBe(0);
  expect(errorSpan.textContent).toBe('Error');
  expect(checkedDiv.textContent).toBe('Not checked');

  act(() => {
    fireEvent.click(checkbox);
  });
  expect(checkedDiv.textContent).toBe('Checked');

  act(() => {
    fireEvent.click(resetButton);
  });
  expect(loadingSpan.textContent).toBe('');
  expect(listDiv.children.length).toBe(0);
  expect(errorSpan.textContent).toBe('');
  expect(checkedDiv.textContent).toBe('Not checked');
});

test('Changing data render only dependent components', () => {
  const renderCb = jest.fn();
  const { container } = render(<App onRender={renderCb} />);

  const loadButton = getByTestId(container, 'loadButton');
  const checkbox = getByTestId(container, 'checkbox');
  const resetButton = getByTestId(container, 'resetButton');

  expect(renderCb).toBeCalledTimes(2);

  act(() => {
    fireEvent.click(loadButton);
  });
  expect(renderCb).toBeCalledTimes(4);

  act(() => {
    jest.runOnlyPendingTimers();
  });
  expect(renderCb).toBeCalledTimes(5);
  expect(renderCb).toBeCalledWith('first');

  act(() => {
    fireEvent.click(checkbox);
  });
  expect(renderCb).toBeCalledTimes(6);
  expect(renderCb).toBeCalledWith('second');

  act(() => {
    fireEvent.click(resetButton);
  });
  expect(renderCb).toBeCalledTimes(8);
});
