// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { PageHeader } from '#/shared/components/page-header.tsx'
import { SearchInput } from '#/shared/components/search-input.tsx'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }) =>
    React.createElement('a', { href: to, ...props }, children),
}))

describe('PageHeader', () => {
  it('should render title', () => {
    render(React.createElement(PageHeader, { title: 'Test Title' }))
    expect(screen.getByText('Test Title')).toBeDefined()
  })

  it('should render description when provided', () => {
    render(React.createElement(PageHeader, { title: 'T', description: 'Test description' }))
    expect(screen.getByText('Test description')).toBeDefined()
  })

  it('should not render description when not provided', () => {
    const { container } = render(React.createElement(PageHeader, { title: 'T' }))
    expect(container.querySelector('p.text-muted-foreground')).toBeNull()
  })

  it('should render action button when provided', () => {
    const { container } = render(
      React.createElement(PageHeader, {
        title: 'T',
        action: React.createElement('button', null, 'Action'),
      }),
    )
    const btn = container.querySelector('button')
    expect(btn).not.toBeNull()
    expect(btn!.textContent).toBe('Action')
  })

  it('should render icon when provided', () => {
    render(
      React.createElement(PageHeader, {
        title: 'T',
        icon: React.createElement('span', { 'data-testid': 'test-icon' }, '🔍'),
      }),
    )
    expect(screen.getByTestId('test-icon')).toBeDefined()
  })
})

describe('SearchInput', () => {
  it('should render with custom placeholder', () => {
    render(React.createElement(SearchInput, { placeholder: 'Buscar socio...', value: '', onChange: vi.fn() }))
    expect(screen.getByPlaceholderText('Buscar socio...')).toBeDefined()
  })

  it('should render with default placeholder', () => {
    render(React.createElement(SearchInput, { value: '', onChange: vi.fn() }))
    expect(screen.getByPlaceholderText('Buscar...')).toBeDefined()
  })

  it('should render with initial value', () => {
    render(React.createElement(SearchInput, { value: 'test', onChange: vi.fn() }))
    expect(screen.getByDisplayValue('test')).toBeDefined()
  })

  it('should fire onChange on input change', () => {
    const onChange = vi.fn()
    render(React.createElement(SearchInput, { value: '', onChange }))
    const input = screen.getByPlaceholderText('Buscar...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'new value' } })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('should render search icon', () => {
    const { container } = render(React.createElement(SearchInput, { value: '', onChange: vi.fn() }))
    expect(container.querySelector('svg.lucide-search')).not.toBeNull()
  })
})
